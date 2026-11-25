import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import { Button, Field } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address'
    if (!form.password) errs.password = 'Enter your password'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setErrors({ form: err.message })
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue learning."
      footer={<>New here? <Link to="/register" className="text-brand font-medium">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {errors.form && <p role="alert" className="mb-4 text-sm text-danger">{errors.form}</p>}
        <Field label="Email" id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
        <Field label="Password" id="password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} error={errors.password} />
        <Button loading={loading} className="w-full mt-2">Log in</Button>
      </form>
    </AuthShell>
  )
}