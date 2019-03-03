import os
import pandas as pd
import psycopg2
import sys
import base64

connection=psycopg2.connect(os.environ['database'])
cur=connection.cursor()

IS_PROD=True

base_path='/app/routes/bin/pythonscript' if IS_PROD else '/home/nischit/Desktop/awesome/popo-backend/routes/bin/pythonscript'

window_size=1*60*60*1000 # per hour


# Loading data and preparation
cur.execute('select * from sentiment_trend order by cast(time as BIGINT) desc limit 1;')
last_insert=list(cur.fetchall())
if len(last_insert)>0:
    cur.execute('select * from good_bad_tweets where cast(_id as BIGINT) > {} order by cast(timestamp as BIGINT) asc;'.format(last_insert[0][0]))    
    m_df=pd.DataFrame(list(cur.fetchall()))
else:
    cur.execute('select * from good_bad_tweets order by cast(timestamp as bigint) asc;')    
    m_df=pd.DataFrame(list(cur.fetchall()))

if m_df.empty:
    print("no good bad tweets found")
    sys.exit(0)
    
m_df.columns=['_id','category','probability','timestamp']
m_df['timestamp']=m_df['timestamp'].apply(lambda time:int(time))
m_df['category']=m_df['category'].apply(lambda time:int(time))
m_df['probability']=m_df['probability'].apply(lambda time:float(time))

df=pd.DataFrame()
df['category']=m_df['category'].copy()
df['timestamp']=m_df['timestamp']
df['probability']=m_df['probability']
df['_id']=m_df['_id']

# Main
endTime=df['timestamp'].iloc[0]+window_size

senti_df=pd.DataFrame()
open_list=[]
close_list=[]
high_list=[]
low_list=[]
time_list=[]
id_list=[]
_id=0
if len(last_insert)==0:
    opn=1000.0
    close=opn
    high=opn
    low=opn
else:
    opn=float(last_insert[0][1])
    close=opn
    high=opn
    low=opn
    cur.execute('select max(_id) from sentiment_trend;')
    _id=cur.fetchall()[0][0]
checkpoint_id=0.0

for i in range(df.shape[0]):
    if df['timestamp'].iloc[i]>=endTime:
        senti_df=senti_df.append({'_id':_id+i+1,'time':endTime,'open':opn,'high':high,'low':low,'close':close},ignore_index=True)
        endTime+=window_size
        opn=close
        close=opn
        high=opn
        low=opn
        while endTime<=df['timestamp'].iloc[i]:
            _id+=1
            senti_df=senti_df.append({'_id':_id,'time':endTime,'open':opn,'high':high,'low':low,'close':close},ignore_index=True)
            endTime+=window_size
            opn=close
            close=opn
            high=opn
            low=opn
    if float(df['category'].iloc[i])==0.0:
        close+=float(df['probability'].iloc[i]) 
    elif float(df['category'].iloc[i])==1.0:
        close-=float(df['probability'].iloc[i]) 
    elif float(df['category'].iloc[i])==4.0: # less good
        close+=float(df['probability'].iloc[i])*0.25 
    elif float(df['category'].iloc[i])==5.0: # less bad
        close-=float(df['probability'].iloc[i])*0.5 
    low=close if close<low else low
    high=close if close>high else high

if not senti_df.empty:
    senti_df=senti_df.drop_duplicates(subset=['_id'], keep='last')
    query=[]
    for index, row in senti_df.iterrows():
        query.append('({},{},{},{},{},{})'.format(row['_id'],round(row['close'],6),round(row['high'],6),round(row['low'],6),round(row['open'],6),int(row['time'])))
    cur.execute("insert into sentiment_trend (_id,close,high,low,open,time) values {};".format(','.join(query)))
    connection.commit()
    print('{} rows added'.format(senti_df.shape[0]))
else:
    print('no rows filtered')
sys.stdout.flush()
