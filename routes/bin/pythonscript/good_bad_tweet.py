import sys
import os
import re
from nltk.stem.snowball import EnglishStemmer
import pickle
import psycopg2
import pandas as pd
import numpy as np
import base64

connection=psycopg2.connect(os.environ['database'])
cur=connection.cursor()


IS_PROD=True

base_path='/app/routes/bin/pythonscript' if IS_PROD else '/home/nischit/Desktop/awesome/popo-backend/routes/bin/pythonscript'

HISTORY_TYPE=1*60*60*24 #1 day



stemmer = EnglishStemmer()
stop_words = pickle.load(open(base_path+'/saved_classifier/stopwords.sav', 'rb'))
my_stop_words='to and http https com co www'
stop_words=stop_words+my_stop_words.split()

def preprocess(_df):
    if 'text' not in _df:
        return pd.DataFrame({'text':[]})
    _df['text']=_df['text'].apply(lambda tweet:str(tweet).lower() if str(tweet).count('#')<=3 else '')
    _df['text']=_df['text'].apply(lambda tweet:re.sub('[^ ]+\.[^ ]+','',tweet))
#     _df['text']=_df['text'].apply(lambda tweet:re.sub('#[^ ]+','',tweet))
    _df['text']=_df['text'].apply(lambda tweet:re.sub('[^a-z.A-Z0-9.!? ]',' ',(tweet)))
    _df['text']=_df['text'].apply(lambda tweet:' '.join([word for word in tweet.strip().split() if word not in stop_words]))
    _df['text']=_df['text'].apply(lambda tweet:stemmer.stem(tweet.strip()))
    return _df

def time_to_milli(_time):
    return round(_time.timestamp())

def to_time(from_time,window_size):
    return from_time+window_size*HISTORY_TYPE

def slice_tweets(tweets,from_time):
    window_size=1
    return tweets[(tweets['timestamp']>=from_time) & (tweets['timestamp']<to_time(from_time,window_size))]

def sentiment(timestamp,df):
    df=df.set_index(np.arange(df.shape[0]))
    #Preprocess
    p_df=preprocess(df.copy())
    p_df=p_df[p_df['text']!='']
    p_df=p_df[p_df['timestamp']>0]
    if p_df.empty: 
        return None
    probability=classifier.predict_proba(p_df['text'])
    
    proba_df=pd.DataFrame()
    for i,row in enumerate(probability):
        if row[0]>0.5 and np.argmax(row)==0: # good 
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':0,'probability':row[0]},ignore_index=True)
        elif row[1]>0.5 and np.argmax(row)==1: # bad
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':1,'probability':row[1]},ignore_index=True)
        elif row[4]>0.5 and np.argmax(row)==4: # less good
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':4,'probability':row[4]},ignore_index=True)
        elif row[5]>0.5 and np.argmax(row)==5: # less bad
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':5,'probability':row[5]},ignore_index=True)
        elif np.argmax(row)==2:
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':2,'probability':row[2]},ignore_index=True)
        else:
            proba_df=proba_df.append({'_id':p_df['_id'].iloc[i],'timestamp':p_df['timestamp'].iloc[i],'category':3,'probability':row[3]},ignore_index=True)

    return [proba_df]


# Twitter Dataset
cur.execute("select * from good_bad_tweets order by cast(_id as BIGINT) desc limit 1;")
gb_l = list(cur.fetchall())

record_exists=len(gb_l)>0

if record_exists:
    last_id=gb_l[-1][0]
    cur.execute("select * from tweets where cast(_id as BIGINT)>{} order by cast(_id as BIGINT) asc;".format(last_id))
    main_df = pd.DataFrame(list(cur.fetchall()))
else:
    cur.execute("select * from tweets order by cast(_id as BIGINT) asc;")
    main_df = pd.DataFrame(list(cur.fetchall()))
    
if main_df.empty:
    print('no values to process')
    sys.exit()

main_df.columns = ['_id','created_at','id_str','text','name','screen_name','profile_image_url','timestamp_ms']
main_df['text'] = main_df['text'].apply(lambda tweet: base64.b64decode(tweet))

main_df=main_df.drop_duplicates(subset=['_id'], keep='first')

tweet_dataset=main_df[['_id','text','timestamp_ms']].copy()
tweet_dataset.columns = ['_id', 'text','timestamp']
tweet_dataset['timestamp']=tweet_dataset['timestamp'].apply(lambda time:int(time))
tweet_df = tweet_dataset.sort_values(['timestamp'], ascending=True)

# Saved Model
classifier = pickle.load(open(base_path+'/saved_classifier/good_bad_classifier.sav', 'rb'))

# Main Loop
current_date=int(tweet_df['timestamp'].iloc[0])
last_date=int(tweet_df['timestamp'].iloc[-1])
step=HISTORY_TYPE

final_proba_df=pd.DataFrame()

for time_milli in range(current_date,last_date+step,step):
    day_tweets=slice_tweets(tweet_df,time_milli)
    x=sentiment(time_milli,day_tweets.copy())
    if x!=None:
        [proba_df]=x
        final_proba_df=pd.concat([final_proba_df,proba_df])

if not final_proba_df.empty:
    final_proba_df=final_proba_df.drop_duplicates(['_id'],keep='last')
    query=[]
    for index, row in final_proba_df.iterrows():
        query.append('({},{},{},{})'.format(int(row['_id']),int(row['category']),round(row['probability'],6),int(row['timestamp'])))
    query=','.join(query)
    cur.execute("insert into good_bad_tweets (_id,category,probability,timestamp) values {};".format(query))
    connection.commit()
    print('{} rows filtered'.format(final_proba_df.shape[0]))
else:
    print('no rows filtered')

sys.stdout.flush()
