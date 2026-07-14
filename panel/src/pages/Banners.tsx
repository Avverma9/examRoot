import { useGetBannersQuery } from '../services/bannersApi';

export function Banners() {
  const { data, isLoading } = useGetBannersQuery();

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">Banners</h1>
      {isLoading ? (
        <p className="text-zinc-400">Loading banners...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.map((banner: any) => (
            <div key={banner._id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-48 object-cover border-b border-zinc-800" />
              ) : (
                <div className="w-full h-48 bg-zinc-950 flex items-center justify-center border-b border-zinc-800">
                  <span className="text-zinc-600 font-medium">No Image</span>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-zinc-100 tracking-tight">{banner.title}</h3>
                <p className="text-xs text-zinc-500 mt-1">{banner.subtitle}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className={banner.isActive ? 'text-[10px] font-bold uppercase tracking-widest text-emerald-400' : 'text-[10px] font-bold uppercase tracking-widest text-zinc-500'}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">Order: {banner.order}</span>
                </div>
              </div>
            </div>
          ))}
          {!data?.data?.length && (
            <div className="col-span-full py-8 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800">
              No banners found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
