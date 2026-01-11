const { z } = require('zod');

// Schema for search results (flattened format)
const searchProductSchema = z.object({
    title: z.string().min(1).trim(),
    price: z.number().positive('Price must be positive number'),
    originalPrice: z.number().positive().nullable().optional(), // MRP
    image: z.string().url().nullable().optional(),
    productUrl: z.string().url().optional(),
    source: z.string().min(1),
    rating: z.number().min(0).max(5).nullable().optional(),
    availability: z.boolean().optional()
});

// Schema for detail scraper results (nested format)
const productSchema = z.object({
    platform: z.enum(['amazon', 'flipkart', 'croma', 'reliance']),
    url: z.string().url(),
    title: z.string().min(1),
    brand: z.string().optional(),
    description: z.string().optional(),
    images: z.array(z.string()).optional(),
    price: z.object({
        mrp: z.number().optional(),
        current: z.number().positive().optional(),
        currency: z.string().default('INR')
    }).optional(),
    rating: z.object({
        average: z.number().min(0).max(5).nullable().optional(),
        count: z.number().min(0).optional()
    }).optional(),
    specifications: z.record(z.string()).optional(),
    availability: z.boolean().optional(),
    reviews: z.array(z.object({
        author: z.string().optional(),
        rating: z.number().min(0).max(5),
        title: z.string().optional(),
        text: z.string().optional(),
        date: z.string().optional()
    })).optional()
});

const normalizeProductData = (data) => {
    try {
        // Validate using detail scraper schema
        const validated = productSchema.parse(data);

        // Additional business logic validation
        if (validated.price?.current) {
            if (validated.price.current <= 0) {
                throw new Error('Current price must be positive');
            }
            if (validated.price.current > 10000000) {
                throw new Error(`Price unrealistic (${validated.price.current}): > 1 crore`);
            }
        }

        return validated;
    } catch (error) {
        console.error(`❌ Validation failed for product: ${data.title}`, error.message);
        throw error;  // Reject invalid data
    }
};

const normalizeSearchProduct = (data) => {
    try {
        // Validate using search schema
        const validated = searchProductSchema.parse(data);

        // Additional validation
        if (validated.price <= 0) {
            throw new Error('Price must be positive');
        }
        if (validated.price > 10000000) {
            throw new Error(`Price unrealistic (${validated.price}): > 1 crore`);
        }
        if (validated.rating !== null && validated.rating !== undefined) {
            if (validated.rating < 0 || validated.rating > 5) {
                throw new Error(`Rating out of range: ${validated.rating}`);
            }
        }

        return validated;
    } catch (error) {
        console.error(`❌ Search product validation failed: ${data.title}`, error.message);
        throw error;  // Reject invalid data
    }
};

module.exports = { productSchema, searchProductSchema, normalizeProductData, normalizeSearchProduct };
