import { useState, useEffect } from 'react'
import './App.css'

// 환경 변수를 직접 사용 (배포된 백엔드로 직접 요청)
// 주의: 백엔드에서 CORS 설정이 필요합니다
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/todos'

// 환경 변수 확인용 (개발 및 배포 환경 모두)
console.log('=== 환경 변수 확인 ===', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  사용중인_API_BASE_URL: API_BASE_URL,
  MODE: import.meta.env.MODE,
  환경: import.meta.env.DEV ? '개발' : '배포'
})

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    tags: []
  })

  // 할일 목록 조회
  const fetchTodos = async () => {
    try {
      setLoading(true)
      console.log('할일 조회 요청 URL:', API_BASE_URL)
      const response = await fetch(API_BASE_URL)
      console.log('할일 조회 응답 상태:', response.status, response.statusText)
      if (!response.ok) {
        const errorText = await response.text()
        console.error('할일 조회 실패 - 응답 본문:', errorText)
        throw new Error(`조회 실패: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      console.log('할일 조회 성공, 데이터:', data)
      setTodos(data)
    } catch (error) {
      console.error('할일 조회 실패:', error)
      console.error('에러 상세:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  // 할일 추가
  const handleAddTodo = async (e) => {
    e.preventDefault()
    try {
      console.log('할일 추가 요청 URL:', API_BASE_URL)
      console.log('요청 데이터:', formData)
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        // 응답 본문이 비어있을 수 있으므로 안전하게 처리
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.message || errorMessage
          }
        } catch (parseError) {
          // JSON 파싱 실패 시 기본 메시지 사용
          console.error('에러 응답 파싱 실패:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      const newTodo = await response.json()
      setTodos([newTodo, ...todos])
      setFormData({ title: '', description: '', dueDate: '', tags: [] })
    } catch (error) {
      console.error('할일 추가 실패:', error)
      alert('할일을 추가하는데 실패했습니다: ' + error.message)
    }
  }

  // 할일 수정
  const handleUpdateTodo = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.message || errorMessage
          }
        } catch (parseError) {
          console.error('에러 응답 파싱 실패:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      const updatedTodo = await response.json()
      setTodos(todos.map(todo => todo._id === id ? updatedTodo : todo))
      setEditingId(null)
    } catch (error) {
      console.error('할일 수정 실패:', error)
      alert('할일을 수정하는데 실패했습니다: ' + error.message)
    }
  }

  // 완료 상태 토글
  const handleToggleComplete = (todo) => {
    handleUpdateTodo(todo._id, { completed: !todo.completed })
  }

  // 할일 삭제
  const handleDeleteTodo = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.message || errorMessage
          }
        } catch (parseError) {
          console.error('에러 응답 파싱 실패:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      setTodos(todos.filter(todo => todo._id !== id))
    } catch (error) {
      console.error('할일 삭제 실패:', error)
      alert('할일을 삭제하는데 실패했습니다: ' + error.message)
    }
  }

  // 수정 모드 시작
  const startEditing = (todo) => {
    setEditingId(todo._id)
    setFormData({
      title: todo.title,
      description: todo.description || '',
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      tags: todo.tags || []
    })
  }

  // 수정 취소
  const cancelEditing = () => {
    setEditingId(null)
    setFormData({ title: '', description: '', dueDate: '', tags: [] })
  }

  return (
    <div className="app-container">
      <div className="todo-app">
        <h1>할일 관리</h1>
        
        {/* 할일 추가 폼 */}
        <form onSubmit={handleAddTodo} className="todo-form">
          <input
            type="text"
            placeholder="할일 제목 *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="설명"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <div className="form-actions">
            <button type="submit">추가</button>
            {editingId && (
              <button type="button" onClick={cancelEditing}>취소</button>
            )}
          </div>
        </form>

        {/* 할일 목록 */}
        <div className="todo-list">
          {loading ? (
            <p>로딩 중...</p>
          ) : todos.length === 0 ? (
            <p className="empty-message">할일이 없습니다.</p>
          ) : (
            todos.map(todo => (
              <div key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <div className="todo-content">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                  />
                  <div className="todo-info">
                    <h3>{todo.title}</h3>
                    {todo.description && <p>{todo.description}</p>}
                    {todo.dueDate && (
                      <span className="due-date">
                        마감일: {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {todo.tags && todo.tags.length > 0 && (
                      <div className="tags">
                        {todo.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {editingId === todo._id ? (
                  <div className="editing-form">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleUpdateTodo(todo._id, formData)}>저장</button>
                      <button onClick={cancelEditing}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div className="todo-actions">
                    <button onClick={() => startEditing(todo)}>수정</button>
                    <button onClick={() => handleDeleteTodo(todo._id)} className="delete-btn">삭제</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default App
