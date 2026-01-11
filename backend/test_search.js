const axios = require('axios');

const testScrape = async () => {
    const products = [
        {
            platform: 'amazon',
            productUrl: 'https://www.amazon.in/dp/B0CHX2F5QT' 
        },
        {
            platform: 'flipkart',
            productUrl: 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4?pid=MOBGTAGPTB3VS24W&lid=LSTMOBGTAGPTB3VS24WCTBCFM&marketplace=FLIPKART&q=iphone+15&store=tyy%2F4io&srno=s_1_2&otracker=AS_Query_OrganicAutoSuggest_6_7_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_6_7_na_na_na&fm=organic&iid=13b8b8cd-95a4-4e71-b465-6c1fd79f5d3d.MOBGTAGPTB3VS24W.SEARCH&ppt=hp&ppn=homepage&ssid=tujc2ym2tp8120hs1767699170632&qH=2f54b45b321e3ae5'
        },
        {
            platform: 'croma',
            productUrl: 'https://www.croma.com/apple-iphone-15-256gb-blue-/p/300738'
        }
    ];

    for (const p of products) {
        console.log(`Testing ${p.platform}...`);
        try {
            const response = await axios.post('http://localhost:5000/api/scrape', p);
            console.log('Success:', JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error('Failed:', error.response ? error.response.data : error.message);
        }
    }
};

testScrape();
