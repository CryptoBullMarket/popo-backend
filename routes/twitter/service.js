const db = require('../database')
const connection = require('../connection')
const presenter = require('./presenter')
const id = require('../constants').id
const values = require('../constants').values
const string = require('../constants').string
const pythoninvoker=require('../../routes/pythoninvoker')

module.exports={
    updateSentimentTrend(callback){
        pythoninvoker.getSentimentTrend((status,data)=>{
            callback(status,data)
        })
    },
    updateTweetDb(){
        const track="BTC, XRP, XVG, BCN, XMR, EOS, IOST, LOOM, TRX, NCASH, POE, CND, FUEL, DNT, MANA, IOST, ETH, ZEN, LINK, CHAT, INS, RPX"
        // const follow=[
            // 'OKEx_',
            // 'nucleusvision',
            // 'gnosisPM',
            // 'AugurProject',
            // 'LiteCoinNews',
            // 'litecoin',
            // 'neo_blockchain',
            // 'adacoin_',
            // 'ontologynetwork',
            // 'QtumOfficial',
            // 'NEMofficial',
            // 'omise_go',
            // 'eos_io',
            // 'bitshares',
            // 'Dashpay',
            // 'monerocurrency',
            // 'DigiByteCoin',
            // 'eth_classic',
            // 'ethereum',
            // 'VeChain',
        //     'Bytecoin_BCN',
        //     'BTCTN',
        //     'BelleZoeLan',
        //     'Bitcoin',
        //     'CoinDeskMarkets',
        //     'Cointelegraph',
        //     'CryptoCoinsNews',
        //     'Ripple',
        //     'SalihSarikaya',
        //     'Tronfoundation',
        //     'bitbns',
        //     'coindesk',
        //     'justinsuntron',
        //     'loomnetwork',
        //     'thee_wolf',
        //     'vergestatus',
        //     'binance',
        //     'krakenfx',
        //     'coinbase'
        //     'Cryptopia_NZ'
        //     'Poloniex'
        //     'Bitstamp'
        // ]
    
        const follow= '867617849208037377, 913837178261663744, 3448833448, 2895317462, 1327769568, 385562752, 2592325530, 756869218574958593, 922358568602365953, 773009781644677120, 2313671966, 831847934534746114, 862675563693125632, 503238457, 2338506822, 2478439963, 2266631022, 759252279862104064, 2312333412, 908576143975919616, 2510084300, 3367334171, 635989143, 357312062, 956155022957531137, 2207129125, 1856523530, 1051053836, 84860555, 894231710065446912, 929949485500735488, 1333467482, 902839045356744704, 912949947397439488, 15946993, 999743535309033473, 877807935493033984, 1399148563, 574032254, 2916954277, 2288889440, 352518189'
        
        presenter.streamTweets(track,follow)
    },
    updateGoodBadTweets(callback){
        pythoninvoker.getGoodBadTweet((status,message)=>{
            callback(values.status.ok,message)
        })
    },
    updateClusterTweets(callback){
        pythoninvoker.custerTweets((status,message)=>{
            callback(values.status.ok,message)
        })
    }
}