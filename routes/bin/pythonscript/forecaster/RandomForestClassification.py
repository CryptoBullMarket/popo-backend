import numpy as np
import os
import math
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.externals import joblib
train_split = 0.8
fileName = os.getcwd() + '/Models/RandomForest_FullFunctions_Classifier.pkl'

def trainTrendPredictionModel(train_df, label_df):
    X_train = np.array(train_df.iloc[0:int(math.floor(train_df.shape[0] * train_split))])
    y_train = np.array(label_df.iloc[0:int(math.floor(label_df.shape[0] * train_split))])
    X_test = np.array(train_df.iloc[int(math.floor(train_df.shape[0] * train_split)) + 1:-1])
    y_test = np.array(label_df.iloc[int(math.floor(label_df.shape[0] * train_split)) + 1:-1])
    #X_train, X_test, y_train, y_test = train_test_split(train_df, label_df, test_size=0.25, random_state=20)


    #classifier = RandomForestClassifier(n_estimators=  1500, criterion='gini', random_state =200, max_features = "auto",max_depth=1000, verbose=1, class_weight='balanced_subsample')

    readFile = open(fileName, 'rb')
    classifier = pickle.load(readFile)
    readFile.close()

    classifier.fit(X_train, y_train)

    print("Training Accuracy is ", classifier.score(X_train, y_train))
    # Predicting the Test set results
    y_pred = classifier.predict(X_test)

    print("random's Testing Accuracy is ", accuracy_score(y_test, y_pred) * 100,"%")

    writeFile = open(fileName, 'wb')
    pickle.dump(classifier, writeFile)
    # Close the pickle instances
    writeFile.close()

def predictTrend(train_df):
    readFile = open(fileName, 'rb')
    clf = pickle.load(readFile)
    readFile.close()
    X_pred = np.array(train_df)
    pred = clf.predict(X_pred)
    return pred

