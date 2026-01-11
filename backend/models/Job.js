const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'electronics'
    },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        type: String,
        default: 'Initializing search...'
    },
    results: {
        type: Array,
        default: []
    },
    errors: {
        type: Array,
        default: []
    },
    platformStatus: {
        type: Object,
        default: {}
    },
    startTime: {
        type: Number,
        default: Date.now
    },
    endTime: {
        type: Number
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        index: { expires: 0 } // TTL index - auto-delete after expiresAt
    }
}, { timestamps: true });

// Index for faster queries
jobSchema.index({ query: 1, category: 1, createdAt: -1 });
jobSchema.index({ status: 1 });

module.exports = mongoose.model('Job', jobSchema);
