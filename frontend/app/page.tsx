export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Token二级市场平台
        </h1>
        <p className="text-center text-gray-600 mb-12">
          AI模型token交易平台
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Token市场</h2>
            <p className="text-gray-600">
              浏览和购买各种AI模型的token服务
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">提供服务</h2>
            <p className="text-gray-600">
              上传您的AI模型token，赚取积分
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API代理</h2>
            <p className="text-gray-600">
              兼容OpenAI API，无缝集成
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
