import { useGetPracticeSetsQuery } from '../services/practiceSetsApi';

export function PracticeSets() {
  const { data, isLoading } = useGetPracticeSetsQuery({});

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">Practice Sets</h1>
      {isLoading ? (
        <p className="text-zinc-400">Loading practice sets...</p>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="text-zinc-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="pb-4 font-semibold border-b border-zinc-800">Title</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Subject</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Topic</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data?.data?.map((set: any) => (
                <tr key={set._id} className="hover:bg-zinc-800/30">
                  <td className="py-4 border-b border-zinc-800/50 font-medium text-zinc-100">{set.title}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{set.subject}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{set.topic}</td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-zinc-500 border-b border-zinc-800/50">No practice sets found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
