/**
 * courseFetcher.js
 * Place in: data/courseFetcher.js
 * 
 * Fetches course data from NCSU catalog API for ClassTracker
 */

const fs = require('fs').promises;
const path = require('path');

class CourseFetcher {
  constructor(cacheDir = './data') {
    this.baseUrl = 'https://catalog.ncsu.edu/api/';
    this.cacheDir = cacheDir;
    
    this.headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Origin': 'https://catalog.ncsu.edu',
      'Referer': 'https://catalog.ncsu.edu/course-search/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  /**
   * Fetch all courses from the catalog
   * @param {boolean} useCache - Whether to use cached data if available
   * @returns {Promise<Array>} Array of course objects
   */
  async fetchAllCourses(useCache = true) {
    const cacheFile = path.join(this.cacheDir, 'courses_cache.json');

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

    // Fetch fresh data
    console.log('🔍 Fetching courses from NCSU catalog...');

    try {
      // Adjust this based on your DevTools Payload tab
      const params = new URLSearchParams({
        page: 'fose',
        route: 'search'
      });

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'POST',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Save to cache
      await this._saveCache(cacheFile, data);
      
      const count = Array.isArray(data) ? data.length : data.count || 'unknown';
      console.log(`✓ Fetched ${count} courses`);
      
      return data;

    } catch (error) {
      console.error(`✗ Error fetching courses: ${error.message}`);
      
      // Try to use stale cache as fallback
      try {
        const staleData = await this._loadCache(cacheFile);
        console.log('⚠ Using stale cache as fallback');
        return staleData;
      } catch {
        return null;
      }
    }
  }

  /**
   * Get a specific course by code
   * @param {string} courseCode - e.g., "CSC 216"
   * @param {Array} courses - Optional array of courses to search
   * @returns {Promise<Object|null>}
   */
  async getCourseByCode(courseCode, courses = null) {
    if (!courses) {
      courses = await this.fetchAllCourses();
    }

    if (!courses) return null;

    const code = courseCode.toUpperCase().trim();

    return courses.find(course => {
      const courseCodeField = (course.code || course.courseCode || course.course_code || '').toUpperCase().trim();
      return courseCodeField === code;
    }) || null;
  }

  /**
   * Get all courses for a subject
   * @param {string} subject - e.g., "CSC", "MA"
   * @param {Array} courses - Optional array of courses to search
   * @returns {Promise<Array>}
   */
  async getCoursesBySubject(subject, courses = null) {
    if (!courses) {
      courses = await this.fetchAllCourses();
    }

    if (!courses) return [];

    const subjectCode = subject.toUpperCase().trim();

    return courses.filter(course => {
      const courseSubject = (course.subject || course.courseSubject || '').toUpperCase().trim();
      return courseSubject === subjectCode;
    });
  }

  /**
   * Search courses by keyword
   * @param {string} query - Search term
   * @param {Array} courses - Optional array of courses to search
   * @returns {Promise<Array>}
   */
  async searchCourses(query, courses = null) {
    if (!courses) {
      courses = await this.fetchAllCourses();
    }

    if (!courses) return [];

    const searchTerm = query.toLowerCase();

    return courses.filter(course => {
      const title = (course.title || course.name || '').toLowerCase();
      const desc = (course.description || course.desc || '').toLowerCase();
      const code = (course.code || course.courseCode || '').toLowerCase();

      return title.includes(searchTerm) || 
             desc.includes(searchTerm) || 
             code.includes(searchTerm);
    });
  }

  /**
   * Export courses to JSON file
   * @param {string} filename - Output filename
   * @returns {Promise<boolean>}
   */
  async exportToJson(filename = 'courses.json') {
    const courses = await this.fetchAllCourses();
    if (!courses) return false;

    const outputPath = path.join(this.cacheDir, filename);
    
    try {
      await fs.writeFile(outputPath, JSON.stringify(courses, null, 2));
      console.log(`✓ Exported to ${outputPath}`);
      return true;
    } catch (error) {
      console.error(`✗ Export error: ${error.message}`);
      return false;
    }
  }

  // Private helper methods

  async _getCacheAge(cacheFile) {
    try {
      const stats = await fs.stat(cacheFile);
      const ageMs = Date.now() - stats.mtimeMs;
      return ageMs / (1000 * 60 * 60); // Convert to hours
    } catch {
      return Infinity;
    }
  }

  async _loadCache(cacheFile) {
    try {
      const data = await fs.readFile(cacheFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      throw new Error(`Cache load failed: ${error.message}`);
    }
  }

  async _saveCache(cacheFile, data) {
    try {
      await fs.writeFile(cacheFile, JSON.stringify(data, null, 2));
      console.log('💾 Cached data saved');
      return true;
    } catch (error) {
      console.error(`✗ Cache save error: ${error.message}`);
      return false;
    }
  }
}

// Convenience functions for quick use
async function getAllCourses(useCache = true) {
  const fetcher = new CourseFetcher();
  return await fetcher.fetchAllCourses(useCache);
}

async function searchCourse(courseCode) {
  const fetcher = new CourseFetcher();
  return await fetcher.getCourseByCode(courseCode);
}

async function getSubjectCourses(subject) {
  const fetcher = new CourseFetcher();
  return await fetcher.getCoursesBySubject(subject);
}

// Export for use in other modules
module.exports = {
  CourseFetcher,
  getAllCourses,
  searchCourse,
  getSubjectCourses
};

// Test if run directly
if (require.main === module) {
  (async () => {
    console.log('Testing Course Fetcher\n' + '='.repeat(50));
    
    const fetcher = new CourseFetcher();
    const courses = await fetcher.fetchAllCourses();
    
    if (courses) {
      console.log(`\nTotal courses: ${courses.length}`);
      console.log('\nFirst course structure:');
      console.log(JSON.stringify(courses[0], null, 2).substring(0, 300) + '...');
      
      console.log('\n' + '='.repeat(50));
      console.log('Testing search for CSC courses...');
      const cscCourses = await fetcher.getCoursesBySubject('CSC');
      console.log(`Found ${cscCourses.length} CSC courses`);
    }
  })();
}