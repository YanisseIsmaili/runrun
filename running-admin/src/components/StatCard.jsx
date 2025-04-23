import { Link } from 'react-router-dom'

const StatCard = ({ title, value, subValue, icon: Icon, iconColor, to }) => {
  const content = (
    <div className="bg-white p-6 rounded-lg shadow transition-all hover:shadow-md flex items-start">
      <div className={`${iconColor} p-3 rounded-full`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-700">{value}</p>
        {subValue && (
          <p className="mt-1 text-sm text-gray-500">{subValue}</p>
        )}
      </div>
    </div>
  )
  
  if (to) {
    return <Link to={to} className="block">{content}</Link>
  }
  
  return content
}

export default StatCard