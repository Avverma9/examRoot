import { useGetVideosQuery } from '../services/videosApi';

export function Videos() {
  const { data, isLoading } = useGetVideosQuery({});

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">Videos</h1>
      {isLoading ? (
        <p className="text-zinc-400">Loading videos...</p>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="text-zinc-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="pb-4 font-semibold border-b border-zinc-800">Title</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Category</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Status</th>
                <th className="pb-4 font-semibold border-b border-zinc-800">Views</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data?.data?.map((video: any) => (
                <tr key={video._id} className="hover:bg-zinc-800/30">
                  <td className="py-4 border-b border-zinc-800/50 font-medium text-zinc-100">{video.title}</td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{video.category}</td>
                  <td className="py-4 border-b border-zinc-800/50">
                    <span className={video.isPublished ? 'text-emerald-400' : 'text-amber-400'}>
                      {video.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 border-b border-zinc-800/50 text-zinc-400">{video.views}</td>
                </tr>
              ))}
              {!data?.data?.length && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-500 border-b border-zinc-800/50">No videos found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
