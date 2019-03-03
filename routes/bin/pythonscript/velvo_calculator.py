import sys
import os
import psycopg2
import pandas as pd
import numpy as np
from matplotlib import pyplot as plot
import json
import math

connection=psycopg2.connect(os.environ['database'])
cur=connection.cursor()

IS_PROD=True

base_path='/app/public/images' if IS_PROD else '/home/nischit/Desktop/awesome/popo-backend/public/images'



table_name=sys.argv[1]
window_size=24
day=0
trend_reversal_threshold=3 # if has been decreasing for x hrs 
consolidation_threshold=0.95 # to consider if is consolidating
up_down_trend_threshhold=0.65 # to consider if is uptrend or down trend
volatility_threshold=0.023

def consolidation(day_df):
    high=day_df['high'].mean() 
    low=day_df['low'].mean() 
    index=0
    count=0
    confidence=0
    for i in range(day_df.shape[0]):
        row=day_df.iloc[i]
        if ((low<row['low'])and(row['low']<high)) or ((high>row['high'])and(row['high']>low)) or ((high<=row['high'])and(high>row['low'])) or ((low>=row['low'])and(low<row['high'])):
            confidence=count/(i+1)
            index=i
            count=count+1
        elif i-index > trend_reversal_threshold: # this is to detect trend change
            break
    vola=(day_df['high'].iloc[0:-1].std())
    vel=(day_df['close'].iloc[index]-day_df['close'].iloc[0])/max(count,1)
    return [confidence,index,vola,vel]

def up_trend(day_df):
    index=0
    count=0
    confidence=0
    peak=-1
    for i,high in enumerate(day_df['high']):
        if peak<high:
            peak=high
            confidence=count/(i+1)
            index=i
            count=count+1
        elif i-index > trend_reversal_threshold: # this is to detect trend change
            break
    vola=(day_df['high'].iloc[0:-1].std())
    vel=(day_df['close'].iloc[index]-day_df['close'].iloc[0])/max(count,1)
    return [confidence,index,vola,vel]

def down_trend(day_df):
    index=0
    count=0
    confidence=0
    trough=np.inf
    for i,low in enumerate(day_df['high']):
        if trough>low:
            trough=low
            confidence=count/(i+1)
            index=i
            count=count+1
        elif i-index > trend_reversal_threshold: # this is to detect trend change
            break
    vola=(day_df['high'].iloc[0:-1].std())
    vel=(day_df['close'].iloc[index]-day_df['close'].iloc[0])/max(count,1)
    return [confidence,index,vola,vel]

def summary_days(df):
    highest=df['high'].max()
    df['high']=df['high']/highest
    df['low']=df['low']/highest
    df['close']=df['close']/highest
    y=df['high'].max()
    prev_index=0
    i=0
    trend_df=pd.DataFrame()
    vola_df=pd.DataFrame()
    plot.plot(range(prev_index,i),np.ones(len(range(prev_index,i)))*y,'r')
    while i < df.shape[0]-1: # 1 day step size
        day_df=df.iloc[i:min(i+window_size,df.shape[0])]
        [confidence,idx,vola,vel]=consolidation(day_df)
        [up_confidence,up_idx,up_vola,up_price_vel]=up_trend(day_df)
        [down_confidence,down_idx,down_vola,down_price_vel]=down_trend(day_df)

        vola=vola if not np.isnan(vola) else -1
        up_vola=up_vola if not np.isnan(up_vola) else -1
        down_vola=down_vola if not np.isnan(down_vola) else -1

        vola=max(vola,up_vola,down_vola)
        
        if confidence>consolidation_threshold or (up_confidence<up_down_trend_threshhold and down_confidence<up_down_trend_threshhold):
            i=i+max(idx,1)
            plot.plot(range(prev_index,i+1),np.ones(len(range(prev_index,i+1)))*y,'y')
            trend_df=trend_df.append([[0,confidence,vel,df['time'].iloc[prev_index],df['time'].iloc[i]]],ignore_index=True)
        else:
            vel=up_price_vel if abs(up_price_vel)>abs(down_price_vel) else down_price_vel
            if up_confidence > down_confidence:
                i = i + max(up_idx,1)
                plot.plot(range(prev_index,i+1),np.ones(len(range(prev_index,i+1)))*y,'g')
                trend_df=trend_df.append([[1,up_confidence,vel,df['time'].iloc[prev_index],df['time'].iloc[i]]],ignore_index=True)
            else:
                i= i + max(down_idx,1)
                plot.plot(range(prev_index,i+1),np.ones(len(range(prev_index,i+1)))*y,'r')
                trend_df=trend_df.append([[-1,down_confidence,vel,df['time'].iloc[prev_index],df['time'].iloc[i]]],ignore_index=True)

        vola_df=vola_df.append([[vola,df['time'].iloc[prev_index],df['time'].iloc[i]]],ignore_index=True)
        # vola_df=vola_df.append([[vola,df['time'].iloc[prev_index],df['time'].iloc[min(i+window_size,df.shape[0]-1)]]],ignore_index=True)
        if vola>volatility_threshold:
            plot.plot(range(prev_index,min(i+window_size,df.shape[0]-1)),np.ones(len(range(prev_index,min(i+window_size,df.shape[0]-1))))*y*1.005,'k')
        prev_index=i
    plot.plot(range(df.shape[0]),df['high'],'r') 
    plot.plot(range(df.shape[0]),df['low'],'g') 
    plot.savefig(base_path+'/{}.png'.format(sys.argv[1]))
    trend_df.columns=['trend','confidence','velocity','start_time','end_time']
    vola_df.columns=['volatility','start_time','end_time']
    return trend_df,vola_df

# delete old values
cur.execute("select * from trend where _key='{}' order by cast(start_time as bigint) asc;".format(table_name))
prev_trend_df = pd.DataFrame(list(cur.fetchall()))
if prev_trend_df.shape[0]>0:
    prev_trend_df.columns=[ '_id', '_key', 'trend', 'confidence', 'velocity', 'start_time', 'end_time' ]
cur.execute("delete from trend where _key='{}';".format(table_name))
cur.execute("delete from volatility where _key='{}';".format(table_name))


cur.execute("select cast(high as real), cast(low as real), cast(close as real), cast(_id as bigint) from (select * from {} order by cast(_id as bigint) desc limit 96) as data order by cast(_id as bigint) asc;".format(table_name))
df = pd.DataFrame(list(cur.fetchall()))
df.columns = ['high', 'low', 'close', 'time']
trend_df,vola_df=summary_days(df)

query=[]
for index, row in trend_df.iterrows():
    query.append("('{}',{},{},{},{},{})".format(table_name,row['trend'],row['confidence'],row['velocity'],row['start_time'],row['end_time']))
cur.execute("insert into trend (_key, trend, confidence, velocity, start_time, end_time) values {};".format(','.join(query)))

query=[]
for index, row in vola_df.iterrows():
    query.append("('{}',{},{},{})".format(table_name,row['volatility'],row['start_time'],row['end_time']))
cur.execute("insert into volatility (_key, volatility, start_time, end_time) values {};".format(','.join(query)))

connection.commit()
should_alert=0.0
if prev_trend_df.shape[0]>0:
    cur_trend=trend_df[(trend_df['start_time']<=prev_trend_df['end_time'].iloc[-1]) & (trend_df['end_time']>=prev_trend_df['end_time'].iloc[-1])]
    prev_trend=prev_trend_df['trend'].iloc[-1]
    if cur_trend.shape[0]>1 or cur_trend['trend'].iloc[0]!=prev_trend:
        should_alert=1.0

# .item() to convert numpy int to python int
print(json.dumps({"is_alert":should_alert,"previous_trend":prev_trend.item(),"current_trend":cur_trend['trend'].iloc[0].item()}))
sys.stdout.flush()
