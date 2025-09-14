import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react')
jest.mock('next/navigation')

describe('LoginForm Component', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  it('renders login form with Arabic text', () => {
    render(<LoginForm />)

    expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument()
    expect(screen.getByText('أدخل بيانات الدخول للوصول إلى لوحة التحكم')).toBeInTheDocument()
    expect(screen.getByLabelText('اسم المستخدم')).toBeInTheDocument()
    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'دخول' })).toBeInTheDocument()
  })

  it('displays all form inputs with correct attributes', () => {
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')

    expect(usernameInput).toHaveAttribute('type', 'text')
    expect(usernameInput).toHaveAttribute('dir', 'rtl')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('dir', 'rtl')
  })

  it('updates input values when user types', async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')

    expect(usernameInput).toHaveValue('admin')
    expect(passwordInput).toHaveValue('admin123')
  })

  it('handles successful login', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: null })

    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')
    const submitButton = screen.getByRole('button', { name: 'دخول' })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        username: 'admin',
        password: 'admin123',
        redirect: false,
      })
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('displays error message on failed login', async () => {
    ;(signIn as jest.Mock).mockResolvedValueOnce({ error: 'Invalid credentials' })

    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')
    const submitButton = screen.getByRole('button', { name: 'دخول' })

    await user.type(usernameInput, 'wrong')
    await user.type(passwordInput, 'wrong')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('اسم المستخدم أو كلمة المرور غير صحيحة')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    ;(signIn as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )

    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')
    const submitButton = screen.getByRole('button', { name: 'دخول' })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    expect(submitButton).toHaveTextContent('جاري تسجيل الدخول...')
    expect(usernameInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('requires both username and password', async () => {
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')

    expect(usernameInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('required')
  })

  it('handles network errors gracefully', async () => {
    ;(signIn as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const user = userEvent.setup()
    render(<LoginForm />)

    const usernameInput = screen.getByPlaceholderText('أدخل اسم المستخدم')
    const passwordInput = screen.getByPlaceholderText('أدخل كلمة المرور')
    const submitButton = screen.getByRole('button', { name: 'دخول' })

    await user.type(usernameInput, 'admin')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('حدث خطأ في تسجيل الدخول')).toBeInTheDocument()
    })
  })
})