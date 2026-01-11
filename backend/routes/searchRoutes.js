const express = require("express");
const router = express.Router();
const searchService = require("../services/searchService");

// Start a scraping job
router.post("/scrape", async (req, res) => {
  try {
    const { query, category } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const result = await searchService.startScraping(query, category);
    res.json(result);
  } catch (error) {
    console.error("Start scraping error:", error);
    res.status(500).json({ message: "Failed to start scraping" });
  }
});

// Check job status
router.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const job = await searchService.getJobStatus(jobId);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  res.json(job);
});

// Diagnostic endpoint to check all jobs
router.get("/debug/jobs", (req, res) => {
  const jobs = searchService.getAllJobs ? searchService.getAllJobs() : {};
  res.json({
    totalJobs: Object.keys(jobs).length,
    jobs: Object.values(jobs).map(job => ({
      id: job.id,
      status: job.status,
      query: job.query,
      resultCount: job.results ? job.results.length : 0,
      errorCount: job.errors ? job.errors.length : 0,
      duration: job.endTime ? job.endTime - job.startTime : 'running'
    }))
  });
});

module.exports = router;
