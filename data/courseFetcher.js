/**
 * courseFetcher.js
 * Place in: data/courseFetcher.js
 *
 * Fetches CSC course data from NCSU catalog API
 * Correct endpoint found via DevTools: /course-search/api/?page=fose&route=search&subject=CSC
 */

const fs = require('fs').promises;
const path = require('path');

class CourseFetcher {
  constructor(cacheDir = './data') {
    // FIXED: correct base URL includes /course-search/
    this.apiUrl = 'https://catalog.ncsu.edu/course-search/api/?page=fose&route=search&subject=CSC';
    this.cacheDir = cacheDir;

    this.headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Content-Type': 'application/json',
      'Origin': 'https://catalog.ncsu.edu',
      'Referer': 'https://catalog.ncsu.edu/course-search/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    // FIXED: srcdb must be empty string, not "2025"
    this.payload = {
      other: { srcdb: '' },
      criteria: [{ field: 'subject', value: 'CSC' }]
    };
  }

  async fetchAllCourses(useCache = true) {
    const cacheFile = path.join(this.cacheDir, 'csc_courses.json');

    // Check cache first
    if (useCache) {
      const cacheAge = await this._getCacheAge(cacheFile);
      if (cacheAge < 24) {
        console.log(`✓ Using cached data (age: ${cacheAge.toFixed(1)} hours)`);
        return await this._loadCache(cacheFile);
      } else if (cacheAge < Infinity) {
        console.log(`⚠ Cache is ${cacheAge.toFixed(1)} hours old, refreshing...`);
      }
    }

    console.log('🔍 Fetching CSC courses from NCSU catalog...');

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(this.payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const courses = this._parseAndDeduplicate(data.results || []);

      await this._saveCache(cacheFile, courses);
      console.log(`✓ Fetched ${courses.length} unique CSC courses`);

      return courses;

    } catch (error) {
      console.error(`✗ Error fetching courses: ${error.message}`);

      // Fall back to stale cache if available
      try {
        const staleData = await this._loadCache(cacheFile);
        console.log('⚠ Using stale cache as fallback');
        return staleData;
      } catch {
        return null;
      }
    }
  }

  _parseAndDeduplicate(results) {
    const seen = new Set();
    return results
      .filter(course => {
        if (seen.has(course.code)) return false;
        seen.add(course.code);
        return true;
      })
      .map(course => ({
        id: course.code.replace(' ', ''),  // "CSC 116" -> "CSC116"
        code: course.code,                 // "CSC 116"
        title: course.title,
        key: course.key,                   // used for detail lookups later
        credits: 3,                        // default - enrich later if needed
        prerequisites: [],                 // enrich later with Bedrock
        offered: []                        // enrich later if needed
      }));
  }

  async getCourseByCode(courseCode, courses = null) {
    if (!courses) courses = await this.fetchAllCourses();
    if (!courses) return null;

    const code = courseCode.toUpperCase().trim();
    return courses.find(c => c.code.toUpperCase() === code) || null;
  }

  async getCoursesBySubject(courses = null) {
    if (!courses) courses = await this.fetchAllCourses();
    return courses || [];
  }

  async searchCourses(query, courses = null) {
    if (!courses) courses = await this.fetchAllCourses();
    if (!courses) return [];

    const term = query.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
  }

  async _getCacheAge(cacheFile) {
    try {
      const stats = await fs.stat(cacheFile);
      return (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    } catch {
      return Infinity;
    }
  }

  async _loadCache(cacheFile) {
    const data = await fs.readFile(cacheFile, 'utf-8');
    return JSON.parse(data);
  }

  async _saveCache(cacheFile, data) {
    try {
      await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
      console.log('💾 Saved to', cacheFile);
    } catch (error) {
      console.error(`✗ Cache save error: ${error.message}`);
    }
  }
}

// Convenience functions
async function getAllCourses(useCache = true) {
  const fetcher = new CourseFetcher();
  return await fetcher.fetchAllCourses(useCache);
}

async function searchCourse(courseCode) {
  const fetcher = new CourseFetcher();
  return await fetcher.getCourseByCode(courseCode);
}

module.exports = { CourseFetcher, getAllCourses, searchCourse };

// Run directly to generate csc_courses.json
if (require.main === module) {
  (async () => {
    console.log('Generating CSC course data\n' + '='.repeat(50));
    const fetcher = new CourseFetcher();
    const courses = await fetcher.fetchAllCourses(false); // force fresh fetch

    if (courses) {
      console.log(`\n✓ Total unique courses: ${courses.length}`);
      console.log('\nSample course:');
      console.log(JSON.stringify(courses[0], null, 2));
    }
  })();
}