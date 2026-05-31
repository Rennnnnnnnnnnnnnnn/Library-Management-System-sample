function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin [animation-duration:1.5s]"></div>
    </div>
  );
}

export default LoadingSpinner;