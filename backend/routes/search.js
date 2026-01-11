const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

/**
 * POST /api/search/scrape
 * Start a new scraping job (Vercel-compatible - returns immediately)
 */
router.post('/scrape', async (req, res) => {
    try {
        const { query, category = 'electronics' } = req.body;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Check for recent duplicate job (within 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingJob = await Job.findOne({
            query: query.toLowerCase().trim(),
            category,
            createdAt: { $gte: fiveMinutesAgo },
            status: { $in: ['completed', 'running'] }
        }).sort({ createdAt: -1 });

        if (existingJob) {
            console.log(`♻️ Reusing existing job ${existingJob._id} for query "${query}"`);
            return res.json({
                jobId: existingJob._id,
                status: existingJob.status,
                cached: true
            });
        }

        // Create new job
        const job = await Job.create({
            query: query.trim(),
            category,
            status: 'pending',
            progress: 'Search initiated...',
            results: [],
            errors: [],
            platformStatus: {},
            startTime: Date.now()
        });

        console.log(`✅ Created job ${job._id} for query "${query}"`);

        // Trigger external worker if configured
        const workerUrl = process.env.WORKER_URL;
        if (workerUrl) {
            // Non-blocking trigger to external worker
            fetch(`${workerUrl}/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.WORKER_SECRET || 'default-secret'}`
                },
                body: JSON.stringify({
                    jobId: job._id.toString(),
                    query: job.query,
                    category: job.category
                })
            }).catch(err => {
                console.error('⚠️ Failed to trigger worker:', err.message);
                // Don't fail the request - worker might process from queue
            });

            console.log(`📤 Triggered external worker for job ${job._id}`);
        } else {
            console.warn('⚠️ WORKER_URL not configured - job will remain pending until worker picks it up');
        }

        // Return immediately (< 1 second)
        res.json({
            jobId: job._id,
            status: 'pending',
            message: 'Job created successfully. Poll /status/:jobId for updates.'
        });

    } catch (error) {
        console.error('Error creating scraping job:', error);
        res.status(500).json({ error: 'Failed to create scraping job' });
    }
});

/**
 * GET /api/search/status/:jobId
 * Check job status (Vercel-compatible - fast query)
 */
router.get('/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Return job data (fast, from database)
        res.json({
            id: job._id,
            query: job.query,
            category: job.category,
            status: job.status,
            progress: job.progress,
            results: job.results,
            errors: job.errors,
            platformStatus: job.platformStatus,
            startTime: job.startTime,
            endTime: job.endTime,
            duration: job.endTime ? job.endTime - job.startTime : null
        });

    } catch (error) {
        console.error('Error fetching job status:', error);
        res.status(500).json({ error: 'Failed to fetch job status' });
    }
});

/**
 * GET /api/search/jobs
 * List recent jobs (optional - for debugging)
 */
router.get('/jobs', async (req, res) => {
    try {
        const { limit = 10, status } = req.query;

        const query = status ? { status } : {};
        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .select('-__v');

        res.json({ jobs });

    } catch (error) {
        console.error('Error listing jobs:', error);
        res.status(500).json({ error: 'Failed to list jobs' });
    }
});

module.exports = router;
