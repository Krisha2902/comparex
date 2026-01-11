// Accessory filter configuration
module.exports = {
    // Keywords that indicate accessory products (should be penalized)
    accessoryKeywords: [
        // Phone/tablet accessories
        'case', 'cover', 'pouch', 'sleeve', 'skin',
        'protector', 'guard', 'screen protector', 'tempered glass',
        'charger', 'cable', 'adapter', 'power bank',
        'stand', 'holder', 'mount', 'dock', 'cradle',
        'earphone', 'earbud', 'headphone', 'headset',

        // Laptop accessories
        'bag', 'backpack', 'sleeve', 'laptop bag',
        'mouse', 'keyboard', 'mousepad',
        'cooler', 'cooling pad', 'laptop stand',

        // General accessories
        'strap', 'band', 'buckle',
        'stylus', 'pen',
        'cleaning kit', 'cleaner',
        'sticker', 'decal',
        'kit', 'combo', 'bundle' // often accessory bundles
    ],

    // Minimum price thresholds by category (in INR)
    // Products below this are likely accessories
    minPriceByCategory: {
        'phone': 5000,
        'smartphone': 5000,
        'mobile': 5000,
        'iphone': 25000,
        'samsung': 8000,

        'laptop': 15000,
        'notebook': 15000,
        'macbook': 50000,

        'tablet': 8000,
        'ipad': 20000,

        'watch': 2000,
        'smartwatch': 3000,

        'tv': 10000,
        'television': 10000,

        'electronics': 1000,
        'default': 500
    },

    // Known major brands for brand matching
    knownBrands: [
        // Phone brands
        'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Redmi',
        'Realme', 'Vivo', 'Oppo', 'Motorola', 'Nokia',
        'Google', 'Pixel', 'Nothing', 'iQOO', 'Poco',

        // Laptop brands
        'Dell', 'HP', 'Lenovo', 'Asus', 'Acer',
        'MSI', 'Razer', 'Alienware', 'ThinkPad',

        // Electronics brands
        'Sony', 'LG', 'Panasonic', 'Philips',
        'Bose', 'JBL', 'Boat', 'Zebronics'
    ]
};
