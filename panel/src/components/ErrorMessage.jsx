export default function ErrorMessage({ message }) {
  return (
    <div className="error-container">
      <i className="fa-solid fa-circle-exclamation"></i>
      <p>{message || 'Something went wrong'}</p>
    </div>
  )
}
