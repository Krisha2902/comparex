module.exports = {
    amazon: {
        title: [
            '#productTitle',
            'h1.product-title',
            'h1'
        ],
        price: {
            current: [
                '.a-price .a-offscreen',
                '.a-price-whole',
                '#priceblock_ourprice',
                '#priceblock_dealprice',
                '.a-price.a-text-price .a-offscreen'
            ],
            mrp: [
                '.a-text-price .a-offscreen',
                '#listPrice',
                '.a-price.a-text-price',
                'span.a-price.a-text-price span.a-offscreen'
            ]
        },
        description: [
            '#productDescription',
            '#feature-bullets',
            '.a-unordered-list.a-vertical'
        ],
        brand: [
            '#bylineInfo',
            '.po-brand .po-break-word',
            'a#bylineInfo'
        ],
        rating: {
            value: ['#acrPopover', 'span.a-icon-alt'],
            count: ['#acrCustomerReviewText']
        },
        availability: [
            '#add-to-cart-button',
            '#buy-now-button',
            '#availability'
        ]
    },
    flipkart: {
        title: ['h1', '.B_NuCI'],
        price: {
            current: ['div[class*="_30jeq3"]'],
            mrp: ['div[class*="_3I9_wc"]']
        },
        images: ['img[class*="_396cs4"]'],
        description: ['.X3BRps', 'div[class*="_1mXcCf"]'],
        specs: {
            row: '.row',
            key: '.col-3-12',
            val: '.col-9-12'
        },
        rating: {
            value: ['div[class*="_3LWZlK"]'],
            count: ['span[class*="_2_R_DZ"]']
        },
        availability: {
            notifyButton: 'button[class*="_32l7f0"]'
        }
    },
    croma: {
        title: ['h1'],
        price: {
            current: ['.pd-price', '.amount'],
            mrp: ['.pd-mrp', '.old-price']
        },
        images: ['.product-gallery-slider img', '.pd-img img'],
        description: ['.overview-desc', '.cp-desc'],
        specs: {
            items: '.cp-specification li'
        },
        rating: {
            element: ['[class*="rating"]', '[class*="stars"]']
        },
        availability: {
            outOfStock: ['[class*="outOfStock"]', '[class*="unavailable"]']
        }
    },
    amazonSearch: {
        productCard: [
            '[data-component-type="s-search-result"]',
            'div[data-asin]:not([data-asin=""])'
        ],
        title: [
            'h2 a.a-link-normal',
            'h2 a',
            '.a-link-normal.s-underline-text',
            'a.a-link-normal'
        ],
        price: ['.a-price span.a-offscreen', '.a-price-whole'],
        rating: ['.a-star-small span.a-icon-alt', 'i.a-icon-star span.a-icon-alt'],
        reviewCount: ['.a-size-base.s-color-base'],
        image: ['img']
    }
};
