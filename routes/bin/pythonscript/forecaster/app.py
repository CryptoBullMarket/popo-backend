import sys
import os
import psycopg2
import pandas as pd
import numpy as np
import math
import requests
import json
from pyti.directional_indicators import average_directional_index
from pyti.money_flow_index import money_flow_index
from pyti.average_true_range import average_true_range
from pyti.on_balance_volume import on_balance_volume
from pyti.rate_of_change import rate_of_change
from pyti.momentum import momentum
from bisect import bisect_left
from mainModel import train_rnn
#from AdaptiveBoosting import trainTrendPredictionModel
#from SVMScikit import trainTrendPredictionModel
#from KNearestNeighbors import trainTrendPredictionModel
from RandomForestClassification import trainTrendPredictionModel
from RandomForestClassification import predictTrend
from mainModel import predict_rnn
import csv



twitter_url = 'https://poposerver.herokuapp.com/twitter/s'

# # Data

# In[105]:


table_name = ["ada_btc_1h",
              "eos_btc_1h",
              "trx_btc_1h",
              "xrp_btc_1h",
              "xvg_btc_1h"]
window_size = 24
day = 0
trend_reversal_threshold = 5  # if has been decreasing for x hrs
consolidation_threshold = 0.95  # to consider if is consolidating
up_down_trend_threshhold = 0.55  # to consider if is uptrend or down trend
volatility_threshold = 0.023
epoch_to_hours = (60 * 60 * 1000)


# # Consolidation

# In[106]:


def consolidation(day_df):
    high = day_df['high'].mean()
    low = day_df['low'].mean()
    index = 0
    count = 0
    confidence = 0
    for i in range(day_df.shape[0]):
        row = day_df.iloc[i]
        if ((low < row['low']) and (row['low'] < high)) or ((high > row['high']) and (row['high'] > low)) or (
                (high <= row['high']) and (high > row['low'])) or ((low >= row['low']) and (low < row['high'])):
            confidence = count / (i + 1)
            index = i
            count = count + 1
        elif i - index > trend_reversal_threshold:  # this is to detect trend change
            break
    return [confidence, index]


# # Up

# In[107]:


def up_trend(day_df):
    index = 0
    count = 0
    confidence = 0
    peak = -1
    for i, high in enumerate(day_df['high']):
        if peak < high:
            peak = high
            confidence = float(count) / (i + 1)
            index = i
            count = count + 1
        elif i - index > trend_reversal_threshold:  # this is to detect trend change
            break
    return [confidence, index]


# # Down

# In[108]:


def down_trend(day_df):
    index = 0
    count = 0
    confidence = 0
    trough = float("inf")
    for i, low in enumerate(day_df['high']):
        if trough > low:
            trough = low
            confidence = float(count) / (i + 1)
            index = i
            count = count + 1
        elif i - index > trend_reversal_threshold:  # this is to detect trend change
            break
    return [confidence, index]


# # Highest and Lowest Peaks

# In[109]:


def preProcessCalculation(df, limit):
    df = df.reset_index()
    adx = np.array(average_directional_index(df['close'], df['high'], df['low'], limit))
    mfi = np.array(money_flow_index(df['close'], df['high'], df['low'], df['volume'], limit - 1))
    atr = np.array(average_true_range(df['close'], limit))
    obv = np.array(on_balance_volume(df['close'], df['volume']))
    rocr = np.array(rate_of_change(df['close'], limit))
    mom = np.array(momentum(df['close'], limit))
    return adx, mfi, atr, obv, rocr, mom


# In[110]:


def summary_days(df):
    # print("lo")
    [adx, mfi, atr, obv, rocr, mom] = preProcessCalculation(df, window_size)
    #volume_mean = df['volume'].mean()
    #df['high'] = df['high'] / df['high'].max()
    #df['low'] = df['low'] / df['low'].max()
    #df['close'] = df['close'] / df['close'].max()
    #df['volume'] = df['volume'] / df['volume'].max()
    #df['open'] = df['open']/df['open'].max()
    # df['volume'] = df['volume'] - volume_mean
    prev_index = 0
    i = 0
    trend_df = pd.DataFrame()
    labels_df = pd.DataFrame()

    while i < df.shape[0] - 1:  # 1 day step size
        day_df = df.iloc[i:min(i + window_size, df.shape[0])]
        [confidence, idx] = consolidation(day_df)
        [up_confidence, up_idx] = up_trend(day_df)
        [down_confidence, down_idx] = down_trend(day_df)

        if confidence > consolidation_threshold or (
                up_confidence < up_down_trend_threshhold and down_confidence < up_down_trend_threshhold):
            i = i + max(idx, 1)
            if math.isnan(adx[i]) or math.isnan(mom[i]) or math.isnan(obv[i]) or math.isnan(mfi[i]) or math.isnan(
                    rocr[i]) or math.isnan(atr[i]):
                continue
            trend_df = trend_df.append(
                [[0, adx[i], mom[i], df['time'].iloc[prev_index], df['time'].iloc[i], obv[i], mfi[i], rocr[i], df['close'].iloc[i],df['high'].iloc[i],df['low'].iloc[i], atr[i], df['open'].iloc[i]]],
                ignore_index=True)
        else:
            if up_confidence > down_confidence:
                i = i + max(up_idx, 1)
                if math.isnan(adx[i]) or math.isnan(mom[i]) or math.isnan(obv[i]) or math.isnan(mfi[i]) or math.isnan(
                        rocr[i]) or math.isnan(atr[i]):
                    continue
                trend_df = trend_df.append(
                    [[1, adx[i], mom[i], df['time'].iloc[prev_index], df['time'].iloc[i], obv[i], mfi[i], rocr[i], df['close'].iloc[i],df['high'].iloc[i],df['low'].iloc[i], atr[i], df['open'].iloc[i]]],
                    ignore_index=True)
            else:
                i = i + max(down_idx, 1)
                if math.isnan(adx[i]) or math.isnan(mom[i]) or math.isnan(obv[i]) or math.isnan(mfi[i]) or math.isnan(
                        rocr[i]) or math.isnan(atr[i]):
                    continue
                trend_df = trend_df.append(
                    [[-1, adx[i], mom[i], df['time'].iloc[prev_index], df['time'].iloc[i], obv[i], mfi[i], rocr[i], df['close'].iloc[i],df['high'].iloc[i],df['low'].iloc[i], atr[i], df['open'].iloc[i]]],
                    ignore_index=True)

        prev_index = i
    trend_df.columns = ['trend', 'AverageDirectionalIndex', 'Momentum', 'start_time', 'end_time', 'volume',
                        'MoneyFlowIndex', 'RateOfChange', 'closePrice', 'highPrice', 'lowPrice', 'volatility', 'openPrice']

    trend_df['trendChangeTime'] = (trend_df['end_time'] - trend_df['start_time']) / epoch_to_hours
    labels_df = trend_df.iloc[1:]
    trend_df = trend_df.iloc[:-1]
    labels_df = labels_df.reset_index()
    trend_df['nextTrend'] = labels_df['trend']
    #trend_df = normalizeRemainingFeatures(trend_df)
    return trend_df, labels_df


# # Training

# In[111]:


def normalizeRemainingFeatures(train_df):

    #Normalizing
    train_df['AverageDirectionalIndex'] = train_df['AverageDirectionalIndex'] / train_df['AverageDirectionalIndex'].max()
    train_df['Momentum'] = train_df['Momentum'] / train_df['Momentum'].max()
    train_df['MoneyFlowIndex'] = train_df['MoneyFlowIndex'] / train_df['MoneyFlowIndex'].max()
    train_df['RateOfChange'] = train_df['RateOfChange'] / train_df['RateOfChange'].max()
    train_df['volatility'] = train_df['volatility'] / train_df['volatility'].max()
    train_df['volume'] = train_df['volume'] / train_df['volume'].max()
    train_df['trendChangeTime'] = train_df['trendChangeTime'] / train_df['trendChangeTime'].max()
    print("done")

    return train_df

def nextTrendTraining(train_df, label_df):
    #train_df = train_df.drop(['index', 'closePrice', 'highPrice', 'lowPrice', 'openPrice', 'end_time', 'start_time', 'nextTrend'], 1)
    train_df = train_df.drop(
       ['index', 'end_time', 'start_time', 'nextTrend'], 1)
    #train_df = train_df.drop(['index', 'AverageDirectionalIndex', 'Momentum', 'MoneyFlowIndex', 'RateOfChange', 'end_time', 'start_time', 'nextTrend'], 1)
    label_df = label_df.drop(['level_0', 'index', 'AverageDirectionalIndex', 'Momentum','volume', 'start_time', 'end_time',
                        'MoneyFlowIndex', 'RateOfChange','closePrice', 'highPrice', 'lowPrice', 'volatility','openPrice', 'trendChangeTime'], 1)
    trainTrendPredictionModel(train_df, label_df)
    print("Hello")


def nextPriceTraining(train_df, label_df, j):
    train_df, label_df = appendTwitterSentiments(train_df, label_df)

    highest_values_dataframe = pd.DataFrame()
    highest_values_dataframe = highest_values_dataframe.append([[
        train_df['AverageDirectionalIndex'].max(),
        train_df['Momentum'].max(),
        train_df['volume'].max(),
        train_df['MoneyFlowIndex'].max(),
        train_df['RateOfChange'].max(),
        train_df['closePrice'].max(),
        train_df['highPrice'].max(),
        train_df['lowPrice'].max(),
        train_df['volatility'].max(),
        train_df['openPrice'].max(),
        train_df['trendChangeTime'].max(),
        train_df['twitterTrend'].max()]])
    highest_values_dataframe.columns = ['AverageDirectionalIndex', 'Momentum', 'volume', 'MoneyFlowIndex', 'RateOfChange', 'closePrice', 'highPrice', 'lowPrice', 'volatility', 'openPrice',  'trendChangeTime', 'twitterTrend']

    train_df = train_df.drop(['level_0', 'index', 'AverageDirectionalIndex', 'Momentum', 'MoneyFlowIndex', 'RateOfChange', 'volatility', 'start_time'], 1)
    label_df = label_df.drop(['level_0','index','trend', 'AverageDirectionalIndex', 'Momentum','volume',
     'MoneyFlowIndex', 'RateOfChange', 'highPrice', 'lowPrice', 'volatility','openPrice', 'start_time', 'end_time'], 1)

    train_df['volume'] = train_df['volume'] / train_df['volume'].max()
    train_df['closePrice'] = train_df['closePrice'] / train_df['closePrice'].max()
    train_df['highPrice'] = train_df['highPrice'] / train_df['highPrice'].max()
    train_df['lowPrice'] = train_df['lowPrice'] / train_df['lowPrice'].max()
    train_df['openPrice'] = train_df['openPrice'] / train_df['openPrice'].max()
    train_df['trendChangeTime'] = train_df['trendChangeTime'] / train_df['trendChangeTime'].max()
    train_df['twitterTrend'] = train_df['twitterTrend'] / train_df['twitterTrend'].max()

    label_df['trendChangeTime'] = label_df['trendChangeTime'] / label_df['trendChangeTime'].max()

    final_pred, final_loss = train_rnn(train_df, label_df, j)
    return highest_values_dataframe, final_loss, final_pred

def takeClosest(myList, myNumber):
    myList = [float(i) for i in myList]
    myNumber = float(myNumber)
    """
    Assumes myList is sorted. Returns closest value to myNumber.

    If two numbers are equally close, return the smallest number.
    """
    pos = bisect_left(myList, myNumber)
    if pos == 0:
        return myList[0], pos
    if pos == len(myList):
        return myList[-1], pos
    before = myList[pos - 1]
    after = myList[pos]
    if after - myNumber < myNumber - before:
       return after, pos
    else:
       return before, pos - 1

def appendTwitterSentiments(train_df, label_df):
    twitterResponse = requests.get(twitter_url, headers={'Content-Type': 'application/json'})
    data = json.loads(twitterResponse.content.decode('utf-8'))
    twitterData = pd.DataFrame(data['message'])
    twitterData['closePriceDiff'] = twitterData['close'] - twitterData['close'].shift(1)
    twitterData = twitterData.drop(0)
    twitterData = twitterData.reset_index()
    twitter_start_index = 0
    prev_price_start_time, prev_price_start_index = takeClosest(train_df['start_time'],
                                                                twitterData['time'][twitter_start_index])
    prev_price_end_time = train_df['end_time'][prev_price_start_index]
    prev_twitter_end_time, prev_twitter_end_index = takeClosest(twitterData['time'], prev_price_end_time)
    prevTempDf = twitterData.iloc[twitter_start_index:prev_twitter_end_index]
    twitter_start_index = twitter_start_index + prev_twitter_end_index
    price_index = prev_price_start_index + 1
    twitter = []
    for i in range(price_index, len(train_df)):
        price_start_time, price_start_index = takeClosest(twitterData['time'], train_df['start_time'][i])
        price_end_time, price_end_index = takeClosest(twitterData['time'], train_df['end_time'][i])
        current_df = twitterData.iloc[price_start_index:price_end_index]
        if current_df['close'].mean() > prevTempDf['close'].mean():
            twitter_value = current_df['high'].mean()
        else:
            twitter_value = current_df['low'].mean()
        prevTempDf = current_df

        twitter.append(twitter_value)

    train_df = train_df.iloc[price_index:]
    train_df['twitterTrend'] = twitter
    train_df = train_df.reset_index()
    label_df = label_df.iloc[price_index:]

    return train_df, label_df

def predictions(dataFrame, highestValues):
    train_df, label_df = appendTwitterSentiments(dataFrame, dataFrame.iloc[1:])
    feed_df = train_df.tail(1)
    nextTrend_startTime = feed_df['end_time'].reset_index()['end_time']
    feed_df['AverageDirectionalIndex'] = feed_df['AverageDirectionalIndex'] / highestValues['AverageDirectionalIndex'].loc[0]
    feed_df['Momentum'] = feed_df['Momentum'] / highestValues['Momentum'].loc[0]
    feed_df['volume'] = feed_df['volume'] / highestValues['volume'].loc[0]
    feed_df['MoneyFlowIndex'] = feed_df['MoneyFlowIndex'] / highestValues['MoneyFlowIndex'].loc[0]
    feed_df['RateOfChange'] = feed_df['RateOfChange'] / highestValues['RateOfChange'].loc[0]
    feed_df['closePrice'] = feed_df['closePrice'] / highestValues['closePrice'].loc[0]
    feed_df['highPrice'] = feed_df['highPrice'] / highestValues['highPrice'].loc[0]
    feed_df['lowPrice'] = feed_df['lowPrice'] / highestValues['lowPrice'].loc[0]
    feed_df['openPrice'] = feed_df['openPrice'] / highestValues['openPrice'].loc[0]
    feed_df['trendChangeTime'] = feed_df['trendChangeTime'] / highestValues['trendChangeTime'].loc[0]
    feed_df['twitterTrend'] = feed_df['twitterTrend'] / highestValues['twitterTrend'].loc[0]


    trend_prediction = predictTrend(feed_df.drop(['level_0', 'index', 'closePrice', 'highPrice', 'lowPrice', 'openPrice', 'end_time', 'start_time', 'nextTrend', 'twitterTrend'], 1))
    nextTrend = feed_df['nextTrend'] = trend_prediction[0]
    if nextTrend == -1:
        nextCharTrend = 'D'
    else:
        nextCharTrend = 'U'
    predictions = predict_rnn(feed_df.drop(['level_0', 'index', 'start_time', 'AverageDirectionalIndex', 'Momentum', 'MoneyFlowIndex', 'RateOfChange', 'volatility', 'end_time'], 1))
    unformatted_price = predictions[0][0] * highestValues['closePrice']
    unformatted_time = predictions[0][1] * highestValues['trendChangeTime']
    nextTrend_endTime = nextTrend_startTime[0] + math.floor(unformatted_time[0])*epoch_to_hours
    nextTrend_Price = abs(unformatted_price)
    return nextCharTrend, nextTrend_startTime[0], int(nextTrend_endTime), abs(math.floor(unformatted_time[0])), nextTrend_Price[0]



# # Main
#with open('predictions_ToBeUploaded.csv', 'a') as writeFile:
    #writer = csv.writer(writeFile)
    #writer.writerow(['Training Loss', 'From currency', 'To currency', 'Trend Start time', 'Trend end time', 'Price ' 'Trend duration', 'Trend'])
#writeFile.close()
final_dataframe = pd.DataFrame()
final_label = pd.DataFrame()
for i in range(0, len(table_name)):
    connection = psycopg2.connect(os.environ['database'])
    cur = connection.cursor()
    table = table_name[i]
    print(table)
    currencies = table.split('_')
    _from = currencies[0]
    _to = currencies[1]
    cur.execute(
        "select cast(high as real), cast(low as real), cast(close as real), cast(_id as bigint), cast(volume as real), cast(open as real) from (select * from {} order by cast(_id as bigint) desc) as data order by cast(_id as bigint) asc;".format(
            table))
    df = pd.DataFrame(list(cur.fetchall()))
    print(len(df))
    df.columns = ['high', 'low', 'close', 'time', 'volume', 'open']
    print("Step 1")
    trend_df, label_df = summary_days(df)

    neutralList = label_df.index[label_df['trend'] == 0].tolist()

    train_df = trend_df.drop(trend_df.index[neutralList])
    label_df = label_df.drop(label_df.index[neutralList])

    train_df = train_df.reset_index()
    label_df = label_df.reset_index()
    #nextTrendTraining(train_df, label_df)

    highestValues, final_training_loss, final_pred = nextPriceTraining(train_df, label_df, i)
    nextTrend, nextTrend_startTime, nextTrend_endTime, nextTrendChangeTime, nextTrend_Price = predictions(train_df, highestValues)

    #with open('predictions_ToBeUploaded.csv', 'a') as writeFile:
        #writer = csv.writer(writeFile)
        #writer.writerow([final_training_loss, _from, _to, nextTrend_startTime, nextTrend_endTime, nextTrend_Price, nextTrendChangeTime, nextTrend])

    #writeFile.close()
    
    cur.execute("insert into prediction(_from, _to, start_time, end_time, price, trend_change_time, trend) values (%s, %s, %s, %s, %s, %s, %s)", (_from, _to, nextTrend_startTime, nextTrend_endTime, nextTrend_Price, nextTrendChangeTime, nextTrend))
    connection.commit()
    connection.close()









