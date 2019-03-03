import sys
import os
import psycopg2
import pandas as pd
import numpy as np
import json
import math


connection=psycopg2.connect(os.environ['database'])
cur=connection.cursor()

table_name=sys.argv[1]
data_count=24*30*8
zoom=24*10
def supres(ltp, n):
    """
    This function takes a numpy array of last traded price
    and returns a list of support and resistance levels 
    respectively. n is the number of entries to be scanned.
    """
    from scipy.signal import savgol_filter as smooth

    #converting n to a nearest even number
    if n%2 != 0:
        n += 1
    
    n_ltp = ltp.shape[0]

    # smoothening the curve
    ltp_s = smooth(ltp, (n+1), 3) 

    #taking a simple derivative
    ltp_d = np.zeros(n_ltp)
    ltp_d[1:] = np.subtract(ltp_s[1:], ltp_s[:-1])
 
    resistance = []
    support = []
    
    for i in range(n_ltp - n):
        arr_sl = ltp_d[i:(i+n)]
        first = arr_sl[:int(n/2)] #first half
        last = arr_sl[int(n/2):] #second half
        
        r_1 = np.sum(first > 0)
        r_2 = np.sum(last < 0)

        s_1 = np.sum(first < 0)
        s_2 = np.sum(last > 0)

        #local maxima detection
        if (r_1 == (n/2)) and (r_2 == (n/2)): 
            resistance.append(ltp[i+(int(n/2)-1)])

        #local minima detection
        if (s_1 == (n/2)) and (s_2 == (n/2)): 
            support.append(ltp[i+(int(n/2)-1)])

    return pd.DataFrame(support), pd.DataFrame(resistance)

cur.execute("select cast(high as real), cast(low as real), cast(close as real), cast(_id as bigint) from (select * from {} order by cast(_id as bigint) desc limit {}) as data order by cast(_id as bigint) asc;".format(table_name,data_count))
df = pd.DataFrame(list(cur.fetchall()))
df.columns = ['high', 'low', 'close', 'time']

sup_df,res_df=supres(np.array(df['close'].iloc[:]),50)

if sup_df.empty or res_df.empty:
    print(json.dumps({'status':'error','message':'res_df or sup_df is empty {}'.format(table_name)}))
    sys.exit()   

sup_df.columns=['close']
res_df.columns=['close']     
        
highest=l_max=df.iloc[-zoom:]['high'].max()
l_min=df.iloc[-zoom:]['low'].min()
        
res_df=res_df.loc[(res_df['close']<=l_max*1.5)&(res_df['close']>=l_min*0.5)]
sup_df=sup_df.loc[(sup_df['close']<=l_max*1.5)&(sup_df['close']>=l_min*0.5)]

res_df['type']=['r']*res_df.shape[0]
sup_df['type']=['s']*sup_df.shape[0]

level_df=pd.concat([res_df,sup_df],ignore_index=True)

if level_df.empty:
    print(json.dumps({'status':'error','message':'level_df empty {}'.format(table_name)}))
    sys.exit()

sll=level_df.loc[(level_df['close']<=df['close'].iloc[-1])&(level_df['close']>=df['close'].iloc[-1]*0.98)]
# delete previous levels
cur.execute("delete from trend_levels where _key='{}';".format(table_name))
cur.execute("delete from stop_loss_level where _key='{}';".format(table_name))
# save levels
query=[]
for index, row in level_df.iterrows():
    query.append("('{}',{},'{}')".format(table_name,row['close'],row['type']))
cur.execute("insert into trend_levels (_key, close, type) values {}".format(','.join(query)))
# save stop loss
if not sll.empty:
    sll=sll['close'].max()
    cur.execute("insert into stop_loss_level (_key, close) values ('{}',{})".format(table_name,sll))

connection.commit()

print(json.dumps({'status':'ok','message':'levels created for {}'.format(table_name)}))
sys.stdout.flush()