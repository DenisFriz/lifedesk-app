export interface PageSEO {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
}

export const SEO: Record<string, PageSEO> = {
  login: {
    title: 'Login | LifeDesk',
    description:
      'Sign in to your LifeDesk account to manage your finances, fitness, goals, and more.',
    canonical: 'https://lifedesk.app/Login'
  },
  register: {
    title: 'Create Account | LifeDesk',
    description:
      'Join LifeDesk for free. Track your finances, fitness, goals, assets, and relationships all in one place.',
    canonical: 'https://lifedesk.app/Register'
  },
  upgrade: {
    title: 'Upgrade to Pro | LifeDesk',
    description:
      'Unlock unlimited tracking, AI insights, and premium features with LifeDesk Plus or Pro.',
    canonical: 'https://lifedesk.app/Upgrade'
  },
  forgotPassword: {
    title: 'Forgot Password | LifeDesk',
    description: 'Reset your LifeDesk password.'
  },
  resetPassword: {
    title: 'Reset Password | LifeDesk',
    description: 'Create a new password for your LifeDesk account.'
  },
  notFound: {
    title: '404 Not Found | LifeDesk',
    description: "The page you're looking for doesn't exist."
  }
}
