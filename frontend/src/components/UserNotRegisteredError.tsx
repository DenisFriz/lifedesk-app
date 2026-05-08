const UserNotRegisteredError = ({ reason = 'user_not_registered' }) => {
  const isAccountDeleted = reason === 'account_deleted'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full ${isAccountDeleted ? 'bg-red-100' : 'bg-orange-100'}`}
          >
            <svg
              className={`w-8 h-8 ${isAccountDeleted ? 'text-red-600' : 'text-orange-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={
                  isAccountDeleted
                    ? 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                    : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                }
              />
            </svg>
          </div>
          <h1
            className={`text-3xl font-bold ${isAccountDeleted ? 'text-red-900' : 'text-slate-900'} mb-4`}
          >
            {isAccountDeleted ? 'Account Deleted' : 'Access Restricted'}
          </h1>
          <p className={`${isAccountDeleted ? 'text-red-700' : 'text-slate-600'} mb-8`}>
            {isAccountDeleted
              ? 'Your account has been permanently deleted and cannot be recovered.'
              : 'You are not registered to use this application. Please contact the app administrator to request access.'}
          </p>
          <div
            className={`p-4 rounded-md text-sm ${isAccountDeleted ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}
          >
            {isAccountDeleted ? (
              <p>
                If you need to create a new account or have questions about your deleted account,
                please contact support.
              </p>
            ) : (
              <>
                <p>If you believe this is an error, you can:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Verify you are logged in with the correct account</li>
                  <li>Contact the app administrator for access</li>
                  <li>Try logging out and back in again</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserNotRegisteredError
