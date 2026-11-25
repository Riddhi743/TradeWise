import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import { Button, Field } from '../components/ui'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Enter your name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address'
    if (form.password.length < 6) errs.password = 'Use at least 6 characters'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    
    try {
      await register(form.name.trim(), form.email, form.password)
      navigate('/onboarding')
    } catch (err) {
      setErrors({ form: err.message })
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with ₹10,00,000 in virtual capital."
      footer={<>Already have an account? <Link to="/login" className="text-brand font-medium">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        {errors.form && <p role="alert" className="mb-4 text-sm text-danger">{errors.form}</p>}
        <Field label="Name" id="name" name="name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
        <Field label="Email" id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} error={errors.email} />
        <Field label="Password" id="password" name="password" type="password" autoComplete="new-password" hint="At least 6 characters" value={form.password} onChange={change} error={errors.password} />
        <Button loading={loading} className="w-full mt-2">Create account</Button>
      </form>
    </AuthShell>
  )
}