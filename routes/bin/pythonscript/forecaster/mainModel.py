
# coding: utf-8

# In[2]:


import sys
import tensorflow as tf
from trendPredictionModel import LstmRNN
from formatData import CryptoData
import numpy as np
import pandas as pd
import pickle
import os

flags = tf.app.flags
flags.DEFINE_integer("crypto_count", 1, "Crypto count [1]")
flags.DEFINE_integer("input_size", 9, "Input size [4]")
flags.DEFINE_integer("output_size", 2, "Output size [1]")
flags.DEFINE_integer("num_steps", 1, "Num of steps [30]")
flags.DEFINE_integer("num_layers", 2, "Num of layer [1]")
flags.DEFINE_integer("lstm_size", 128, "Size of one LSTM cell [128]")
flags.DEFINE_integer("batch_size", 6, "The size of batch images [64]")
flags.DEFINE_float("keep_prob", 0.9, "Keep probability of dropout layer. [0.8]")
flags.DEFINE_float("init_learning_rate", 0.001, "Initial learning rate at early stage. [0.001]")
flags.DEFINE_float("learning_rate_decay", 0.99, "Decay rate of learning rate. [0.99]")
flags.DEFINE_integer("init_epoch", 10, "Num. of epoches considered as early stage. [5]")
flags.DEFINE_integer("max_epoch", 1000, "Total training epoches. [50]")
flags.DEFINE_integer("embed_size", None, "If provided, use embedding vector of this size. [None]")
flags.DEFINE_string("stock_symbol", None, "Target stock symbol [None]")
flags.DEFINE_integer("sample_size", 4, "Number of stocks to plot during training. [4]")
flags.DEFINE_boolean("train", True, "True for training, False for testing [False]")

FLAGS = flags.FLAGS


# # Reformat Data

# In[ ]:


def load_data(input_size, num_steps,training_data, labels, target_symbol=None, test_ratio=0.2):
        return [
            CryptoData(
                target_symbol,
                df = training_data,
                labels = labels,
                input_size=input_size,
                num_steps=num_steps,
                test_ratio=test_ratio)
        ]


# # Train Model

# In[ ]:


def train_rnn(df, y, i):
    #result = pd.DataFrame(columns= ['Output', 'MSE'])
    tf.reset_default_graph()
    with tf.Session() as sess:
        rnn_model_new = LstmRNN(
            sess,
            FLAGS.crypto_count,
            lstm_size=FLAGS.lstm_size,
            num_layers=FLAGS.num_layers,
            num_steps=FLAGS.num_steps,
            input_size=FLAGS.input_size,
            embed_size=FLAGS.embed_size,
            output_size=FLAGS.output_size
        )
        print(df)
        print(y)
        data = load_data(
            FLAGS.input_size,
            FLAGS.num_steps,
            training_data=df,
            labels= y,
            target_symbol=FLAGS.stock_symbol,
            test_ratio = 0.3
         )
        print(data[0])
        if i ==0:
            final_pred, final_loss = rnn_model_new.train(sess= sess, dataset_list= data, config= FLAGS)
            #result.append([[final_pred, final_loss]])
        else:
            final_pred, final_loss = rnn_model_new.load(sess= sess, data= data, config= FLAGS)
            #result.append([[final_pred, final_loss]])
        print(i)
        print(final_pred)
        print(final_loss)
        return final_pred, final_loss
    #print(result)
    #return result


# # Predict Model

# In[ ]:


def predict_rnn(df):
    tf.reset_default_graph()
    with tf.Session() as sess:
        rnn_model_new = LstmRNN(
            sess,
            FLAGS.crypto_count,
            lstm_size=FLAGS.lstm_size,
            num_layers=FLAGS.num_layers,
            num_steps=FLAGS.num_steps,
            input_size=FLAGS.input_size,
            embed_size=FLAGS.embed_size,
            output_size=FLAGS.output_size
        )
        data = df.values
        data = data.reshape(data.shape[0], 1, data.shape[1])
        pred = rnn_model_new.predict(sess= sess, data= data)
        return np.array(pred)


# # Main Function

# In[ ]:


def mainFunction(action, dataFrame, labels):
    if (action == 'Train'):
        tf.app.run(train(dataFrame, labels))
    else: 
        prediction = predict(dataFrame, labels)

