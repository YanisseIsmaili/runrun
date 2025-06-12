import { Link } from 'react-router-dom'

const StatCard = ({ title, value, subValue, icon: Icon, iconColor, to }) => {
  const content = (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`${iconColor} p-3 rounded-lg flex-shrink-0`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
            </dd>
            {subValue && (
              <dd className="text-sm text-gray-600 mt-1">{subValue}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
  
  if (to) {
    return (
      <Link to={to} className="block hover:scale-105 transition-transform duration-200">
        {content}
      </Link>
    )
  }
  
  return content
}

export default StatCard