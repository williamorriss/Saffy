type SearchBarProp = {
    searchTerm: string;
    setSearch: (searchTerm: string) => void;
    refreshFeed: () => void;
}

export function SearchBar ( { searchTerm, setSearch, refreshFeed } : SearchBarProp) {

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        refreshFeed();
    };

    return (
        <form className="flex w-full gap-4 p-4" onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Searching...." 
                className="flex-1 w-7/8 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-black"
            />
            <button 
                type="submit"
                className="w-1/8 px-6 py-2 !bg-blue-500 text-white rounded-lg hover:!bg-blue-600 transition-colors cursor-pointer"
            >
                Search
            </button>
        </form>
    );
}