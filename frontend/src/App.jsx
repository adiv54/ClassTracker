import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'https://59d2p9h3z7.execute-api.us-east-1.amazonaws.com'

export default function App() {
  const [courses, setCourses] = useState([])
  const [completed, setCompleted] = useState([])
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [screen, setScreen] = useState('form')
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API_URL}/courses`)
      .then(r => setCourses(r.data.courses))
      .catch(() => setError('Failed to load courses'))
  }, [])

  const toggleCourse = (id) => {
    setCompleted(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!question.trim()) return
    setScreen('loading')
    setError('')

    try {
      const res = await axios.post(`${API_URL}/plan`, {
        completedCourses: completed,
        question
      })
      setReply(res.data.reply)
      setScreen('result')
    } catch {
      setError('Something went wrong. Try again.')
      setScreen('form')
    }
  }

  const handleReset = () => {
    setScreen('form')
    setReply('')
    setQuestion('')
    setError('')
  }

  return (
    <div className="app" style={{
      backgroundImage: 'url(/photos/BandW.JPG)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>

      {/* Logo persists across ALL screens */}
      <img
        src="/photos/wolf.png"
        alt="Obsidian logo"
        style={{
          position: 'fixed',
          top: '16px',
          left: '20px',
          width: '100px',
          height: '100px',
          zIndex: 1000,
          opacity: 0.9
        }}
      />

      {screen === 'loading' && (
        <div>
          <div className="header">
            <h1>Ask a Detective</h1>
            <p>NC State Degree Planner</p>
          </div>
          <div className="loading">
            <p>Your detective is reviewing your case file...</p>
          </div>
        </div>
      )}

      {screen === 'result' && (
        <div>
          <div className="header">
            <h1>Ask a Detective</h1>
            <p>NC State Degree Planner</p>
          </div>
          <h2>Your Case File</h2>
          <div className="result">{reply}</div>
          <button className="back-btn" onClick={handleReset}>
            Start New Case
          </button>
        </div>
      )}

      {screen === 'form' && (
        <div>
          <div className="header">
            <h1>Ask a Course Detective</h1>
            <p>NC State Computer Science Degree Planner</p>
          </div>

          {error && <div className="error">{error}</div>}

          <h2>Mark Completed Courses</h2>
          <p className="completed-count">
            {completed.length} of {courses.length} courses completed
          </p>

          <div className="course-list">
            {courses.map(course => (
              <div
                key={course.id}
                className={`course-item ${completed.includes(course.id) ? 'checked' : ''}`}
                onClick={() => toggleCourse(course.id)}
              >
                <input
                  type="checkbox"
                  checked={completed.includes(course.id)}
                  onChange={() => toggleCourse(course.id)}
                  onClick={e => e.stopPropagation()}
                />
                <label>{course.code} — {course.title}</label>
              </div>
            ))}
          </div>

          <div className="question-section">
            <h2>Ask Your Course Detective</h2>
            <textarea
              placeholder="e.g. What should I take next semester? Can I take CSC 316 yet? I want to focus on AI, what path do you recommend?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={!question.trim() || loading}
          >
            Consult Your Course Detective
          </button>
        </div>
      )}

    </div>
  )
}