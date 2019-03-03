import sys
import os
import psycopg2
import pandas as pd
import numpy as np
from matplotlib import pyplot as plot
import math
import base64
import time
import re
from sklearn.cluster import SpectralClustering,AgglomerativeClustering,KMeans
from sklearn.pipeline import make_pipeline
from sklearn.feature_extraction.text import TfidfVectorizer,CountVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import Normalizer
from nltk.corpus import stopwords
from nltk.stem.snowball import EnglishStemmer
from sklearn.metrics import silhouette_score
from collections import Counter

connection=psycopg2.connect(os.environ['database'])
cur=connection.cursor()

cur.execute("select tweets._id,text,timestamp,probability,category from tweets inner join (select * from good_bad_tweets where cast(timestamp as bigint)>{}) as t on tweets._id=t._id;".format(int(round(time.time() * 1000))-1000*60*60*24*4))
x=cur.fetchall()

main_df=pd.DataFrame(x)
main_df.columns=['_id','text','timestamp','probability','category']
main_df['text']=main_df['text'].apply(lambda value: str(base64.b64decode(value),'utf-8'))

stemmer = EnglishStemmer()
stop_words = pickle.load(open('/home/nischit/Desktop/awesome/popo-backend/routes/bin/pythonscript/saved_classifier/stopwords.sav', 'rb'))
my_stop_words='to and http https com co www'
stop_words=stop_words+my_stop_words.split()

def preprocess(df):
    df['text']=df['text'].apply(lambda tweet:str(tweet) if str(tweet).count('#')<=3 else '')
    df['text']=df['text'].apply(lambda tweet:re.sub('[^ ]+\.[^ ]+','',tweet))
    df['text']=df['text'].apply(lambda tweet:re.sub('#[^ ]+','',tweet))
    df['text']=df['text'].apply(lambda tweet:re.sub('[^a-zA-Z0-9 ]',' ',(tweet)))
    df['text']=df['text'].apply(lambda tweet:' '.join([word.lower() for word in tweet.strip().split() if word.lower() not in stop_words]))
    df['text']=df['text'].apply(lambda tweet:stemmer.stem(tweet.strip()))
    return df

svd = TruncatedSVD(algorithm='randomized', n_components=5, n_iter=7, random_state=42, tol=0.0)
vectorizer = TfidfVectorizer()
reduced = make_pipeline(vectorizer,svd,Normalizer(copy=False)) 

#Preprocess
day_tweets=preprocess(main_df.copy())
day_tweets=day_tweets[day_tweets['text']!='']
#vectorize and reduce
reduced.fit(day_tweets['text'])
day_tweets['text']=[vector for vector in reduced.transform(day_tweets['text'])]
#clustering
range_n_clusters = list(np.arange(2,25))            # clusters range you want to select
best_clusters_size = 0                       # best cluster number which you will get
previous_silh_avg = 0.0
best_cluster=None

data_to_fit=[tweet.ravel() for tweet in day_tweets['text']]
for n_clusters in range_n_clusters:
#     cluster=SpectralClustering(n_clusters=n_clusters)
    cluster=KMeans(n_clusters=n_clusters)
    labels = cluster.fit_predict(data_to_fit)
    silhouette_avg = silhouette_score(data_to_fit, labels)
    if silhouette_avg > previous_silh_avg:
        previous_silh_avg = silhouette_avg
        best_clusters_size = n_clusters
        day_tweets['cluster']=labels
        best_cluster=cluster
    else:
        break
day_tweets['text']=main_df['text'].iloc[day_tweets.index]

values=[]
for i in range(best_clusters_size):
    # get frequency of tweets
    c_df=day_tweets.loc[day_tweets['cluster']==i]
    countdf=pd.DataFrame(Counter(c_df['text']).most_common(20))
    
    # filter clusters with count greater than 10
    ldf=countdf[countdf[1]>10]
    
    # concatinate frequency to tweets df
    fdf=c_df.drop_duplicates(subset=['text'], keep='first')
    fdf['freq']=-1
    for idx,row in ldf.iterrows():
        fdf.at[fdf[fdf['text']==ldf[0].iloc[idx]].index,'freq']=ldf[1].iloc[idx]
    fdf=fdf[fdf['freq']>-1]
    
    # save cluster tweet detail
    fdf=fdf.drop(columns=['text', 'timestamp', 'category', 'probability']).to_dict('records')

    # prepare insert query
    for row in fdf:
        values.append("({},{},{})".format(row['_id'],row['cluster'],row['freq']))

cur.execute("truncate table cluster_tweets;")
cur.execute("insert into cluster_tweets (_id,cluster,frequency) values {};".format(",".join(values)))
connection.commit()
