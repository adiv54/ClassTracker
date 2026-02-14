"""
NCSU Course Catalog Data Fetcher
Place this in: data/course_fetcher.py

Fetches course data from NCSU catalog API and saves it for the ClassTracker app
"""

import requests
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Union

class CourseFetcher:
    """Handles fetching and caching course data from NCSU catalog"""
    
    def __init__(self, cache_dir: str = "./data"):
        """
        Initialize the course fetcher
        
        Args:
            cache_dir: Directory to store cached course data
        """
        self.base_url = "https://catalog.ncsu.edu/api/"
        self.cache_dir = cache_dir
        
        # Ensure cache directory exists
        os.makedirs(cache_dir, exist_ok=True)
        
        # Headers to mimic browser
        self.headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://catalog.ncsu.edu',
            'Referer': 'https://catalog.ncsu.edu/course-search/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
    
    def fetch_all_courses(self, use_cache: bool = True) -> Optional[List[Dict]]:
        """
        Fetch all courses from the catalog
        
        Args:
            use_cache: If True, use cached data if available and recent
        
        Returns:
            List of course dictionaries
        """
        cache_file = os.path.join(self.cache_dir, "courses_cache.json")
        
        # Check cache first
        if use_cache and os.path.exists(cache_file):
            cache_age_hours = self._get_cache_age(cache_file)
            if cache_age_hours < 24:  # Cache is less than 24 hours old
                print(f"✓ Using cached data (age: {cache_age_hours:.1f} hours)")
                return self._load_cache(cache_file)
            else:
                print(f"⚠ Cache is {cache_age_hours:.1f} hours old, refreshing...")
        
        # Fetch fresh data
        print("🔍 Fetching courses from NCSU catalog...")
        
        # Build request - adjust based on what you see in Payload tab
        params = {
            'page': 'fose',
            'route': 'search'
        }
        
        # You may need to adjust this based on the actual Payload format
        payload = {
            'keyword': '',
            'subject': '',
            'level': '',
            'year': ''
        }
        
        try:
            # Try with query parameters first
            response = requests.post(
                self.base_url,
                params=params,
                headers=self.headers,
                timeout=30
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Save to cache
            self._save_cache(cache_file, data)
            
            count = len(data) if isinstance(data, list) else data.get('count', 'unknown')
            print(f"✓ Fetched {count} courses")
            
            return data
            
        except Exception as e:
            print(f"✗ Error fetching courses: {e}")
            # Try to use stale cache as fallback
            if os.path.exists(cache_file):
                print("⚠ Using stale cache as fallback")
                return self._load_cache(cache_file)
            return None
    
    def get_course_by_code(self, course_code: str, courses: List[Dict] = None) -> Optional[Dict]:
        """
        Get a specific course by code (e.g., "CSC 216")
        
        Args:
            course_code: Course code like "CSC 216"
            courses: Optional list of courses to search. If None, fetches all courses.
        
        Returns:
            Course dictionary or None
        """
        if courses is None:
            courses = self.fetch_all_courses()
        
        if not courses:
            return None
        
        course_code = course_code.upper().strip()
        
        for course in courses:
            # Check various possible field names
            code = (course.get('code', '') or 
                   course.get('courseCode', '') or 
                   course.get('course_code', '')).upper().strip()
            
            if code == course_code:
                return course
        
        return None
    
    def get_courses_by_subject(self, subject: str, courses: List[Dict] = None) -> List[Dict]:
        """
        Get all courses for a subject (e.g., "CSC")
        
        Args:
            subject: Subject code like "CSC", "MA", "ACC"
            courses: Optional list of courses to search
        
        Returns:
            List of matching courses
        """
        if courses is None:
            courses = self.fetch_all_courses()
        
        if not courses:
            return []
        
        subject = subject.upper().strip()
        matches = []
        
        for course in courses:
            course_subject = (course.get('subject', '') or 
                            course.get('courseSubject', '')).upper().strip()
            
            if course_subject == subject:
                matches.append(course)
        
        return matches
    
    def search_courses(self, query: str, courses: List[Dict] = None) -> List[Dict]:
        """
        Search courses by keyword in title or description
        
        Args:
            query: Search query
            courses: Optional list of courses to search
        
        Returns:
            List of matching courses
        """
        if courses is None:
            courses = self.fetch_all_courses()
        
        if not courses:
            return []
        
        query = query.lower()
        matches = []
        
        for course in courses:
            # Search in title and description
            title = (course.get('title', '') or course.get('name', '')).lower()
            desc = (course.get('description', '') or course.get('desc', '')).lower()
            code = (course.get('code', '') or course.get('courseCode', '')).lower()
            
            if query in title or query in desc or query in code:
                matches.append(course)
        
        return matches
    
    def _get_cache_age(self, cache_file: str) -> float:
        """Get age of cache file in hours"""
        if not os.path.exists(cache_file):
            return float('inf')
        
        modified_time = os.path.getmtime(cache_file)
        age_seconds = datetime.now().timestamp() - modified_time
        return age_seconds / 3600  # Convert to hours
    
    def _load_cache(self, cache_file: str) -> Optional[Union[List, Dict]]:
        """Load data from cache file"""
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"✗ Error loading cache: {e}")
            return None
    
    def _save_cache(self, cache_file: str, data: Union[List, Dict]) -> bool:
        """Save data to cache file"""
        try:
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"💾 Cached data saved")
            return True
        except Exception as e:
            print(f"✗ Error saving cache: {e}")
            return False
    
    def export_to_json(self, filename: str = "courses.json") -> bool:
        """
        Export all courses to a JSON file
        
        Args:
            filename: Output filename (will be saved in cache_dir)
        
        Returns:
            True if successful
        """
        courses = self.fetch_all_courses()
        if not courses:
            return False
        
        output_path = os.path.join(self.cache_dir, filename)
        try:
            with open(output_path, 'w') as f:
                json.dump(courses, f, indent=2)
            print(f"✓ Exported to {output_path}")
            return True
        except Exception as e:
            print(f"✗ Export error: {e}")
            return False


# Convenience functions for quick use
def get_all_courses(use_cache: bool = True) -> List[Dict]:
    """Quick function to get all courses"""
    fetcher = CourseFetcher()
    return fetcher.fetch_all_courses(use_cache=use_cache) or []

def search_course(course_code: str) -> Optional[Dict]:
    """Quick function to search for a specific course"""
    fetcher = CourseFetcher()
    return fetcher.get_course_by_code(course_code)

def get_subject_courses(subject: str) -> List[Dict]:
    """Quick function to get all courses in a subject"""
    fetcher = CourseFetcher()
    return fetcher.get_courses_by_subject(subject)


if __name__ == "__main__":
    # Test the fetcher
    print("Testing Course Fetcher\n" + "="*50)
    
    fetcher = CourseFetcher()
    
    # Fetch all courses
    courses = fetcher.fetch_all_courses()
    
    if courses:
        print(f"\nTotal courses: {len(courses)}")
        print(f"\nFirst course structure:")
        print(json.dumps(courses[0], indent=2)[:300] + "...")
        
        # Test search
        print("\n" + "="*50)
        print("Testing search for CSC courses...")
        csc_courses = fetcher.get_courses_by_subject("CSC")
        print(f"Found {len(csc_courses)} CSC courses")