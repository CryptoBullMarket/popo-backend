
# coding: utf-8

# In[ ]:


import numpy as np
import random


# # Converting data to train and test

# In[ ]:


class CryptoData(object):
    def __init__(self,
                 stock_sym,
                 df,
                 labels,
                 input_size=1,
                 num_steps=30,
                 test_ratio=0.1,
                 normalized=True):
        
        self.stock_sym = stock_sym
        self.input_size = input_size
        self.num_steps = num_steps
        self.test_ratio = test_ratio
        self.normalized = normalized
        self.training_data = df
        self.labels = labels

        dates = df.iloc[:, 3].values.tolist()
        df = df.drop(['end_time'], axis = 1)
        x = np.array(df.values.tolist())
        y = np.array(labels.values.tolist())

        x = x.flatten('C')
        i = num_steps

        seq = [np.array(x[i * input_size: (i + 1) * input_size]) for i in range(len(x) // input_size)]
        
        X_raw_seq = np.array([seq[i: i + num_steps] for i in range(len(seq)-num_steps)])

        y_raw_seq = np.array([y[i + num_steps] for i in range(len(y) - num_steps)])

        dates_y = np.array([dates[i + num_steps] for i in range(len(dates)-num_steps)])

        train_size = int(len(X_raw_seq) * (1-test_ratio))
        
        self.train_X, self.test_X = X_raw_seq[:train_size], X_raw_seq[train_size:]
        self.train_y, self.test_y = y_raw_seq[:train_size], y_raw_seq[train_size:]
        
        self.dates = np.array(dates_y[train_size:])

        print(self.train_y.shape,self.train_X.shape,self.test_y.shape,self.test_X.shape, self.dates.shape)

    def generate_one_epoch(self, batch_size):
        num_batches = int(len(self.train_X)) // batch_size
        if batch_size * num_batches < len(self.train_X):
            num_batches += 1
        batch_indices = list(range(num_batches))
        random.shuffle(batch_indices)
        for j in batch_indices:
            batch_X = self.train_X[j * batch_size: (j + 1) * batch_size]
            batch_y = self.train_y[j * batch_size: (j + 1) * batch_size]
            # assert set(map(len, batch_X)) == {self.num_steps}
            yield batch_X, batch_y