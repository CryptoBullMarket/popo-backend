import sys
import os
import pickle
import pandas as pd
import numpy as np
import re
from nltk.corpus import stopwords
from nltk.stem.snowball import EnglishStemmer

IS_PROD=True

base_path='/app/routes/bin/pythonscript' if IS_PROD else '/home/nischit/Desktop/awesome/popo-server/routes/bin/pythonscript'


stemmer = EnglishStemmer()
stop_words = pickle.load(open(base_path+'/saved_classifier/stopwords.sav', 'rb'))
my_stop_words='to and http https com co www'
stop_words=stop_words+my_stop_words.split()

def preprocess(_df):
    if 'text' not in _df:
        return pd.DataFrame({'text':[]})
    _df['text']=_df['text'].apply(lambda tweet:str(tweet) if str(tweet).count('\n')<=3 else '')
    _df['text']=_df['text'].apply(lambda tweet:tweet if tweet.count('#')<=3 else '')
    _df['text']=_df['text'].apply(lambda tweet:re.sub('[^ ]+\.[^ ]+','',tweet))
    _df['text']=_df['text'].apply(lambda tweet:re.sub('#[^ ]+','',tweet))
    _df['text']=_df['text'].apply(lambda tweet:re.sub('[^a-zA-Z0-9 ]',' ',(tweet)))
    _df['text']=_df['text'].apply(lambda tweet:' '.join([word.lower() for word in tweet.strip().split() if word.lower() not in stop_words]))
    _df['text']=_df['text'].apply(lambda tweet:stemmer.stem(tweet.strip()))
    return _df

classifier = pickle.load(open(base_path+'/saved_classifier/filter_model.sav', 'rb'))
df=pd.read_json(sys.argv[1],encoding = 'utf8')

p_df=preprocess(df.copy())
p_df=p_df[p_df['text']!='']

prediction=classifier.predict(p_df['text'])
probability = classifier.predict_proba(p_df['text'])


good_tweet_index=[i for i,val in enumerate(prediction) if val==1]
proba_good_tweet_index=[i for i,row in enumerate(probability) if row[1]>0.99]


filtered_df = p_df.iloc[good_tweet_index]
proba_filtered_df = p_df.iloc[proba_good_tweet_index]

actual_df = df.iloc[filtered_df.index]
proba_actual_df = df.iloc[proba_filtered_df.index]

print(actual_df.to_json(orient='records'))
sys.stdout.flush()
