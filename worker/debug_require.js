try {
    console.log('Trying to require config/accessoryFilters...');
    const config = require('./config/accessoryFilters');
    console.log('✅ Success:', Object.keys(config));

    console.log('Trying to require utils/relevanceScorer...');
    const scorer = require('./utils/relevanceScorer');
    console.log('✅ Success:', Object.keys(scorer));
} catch (err) {
    console.error('❌ Error:', err);
    console.error('Stack:', err.stack);
}
