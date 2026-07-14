import { useGetMockTestsQuery } from '../services/mockTestsApi';

export function MockTests() {
  const { data, isLoading } = useGetMockTestsQuery({});

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">Mock Tests</h1>
      {isLoading ? (
        <p className="text-zinc-400">Loading mock tests...</p>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="text-zinc-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="pb-4 font-semibold border-b border-zinc-800">Title</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Category</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Duration (min)</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data?.data?.map((test: any) => (
                <tr key={test._id} className="hover:bg-zinc-800/30">
                  <td className="py-4 border-b border-zinc-800/50 font-medium text-zinc-100">{test.title}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{test.category}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{test.duration}</td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-500 border-b border-zinc-800/50">No tests found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
