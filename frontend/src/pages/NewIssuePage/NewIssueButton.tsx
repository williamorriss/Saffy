import { useAuth } from "../../hooks/AuthContext.tsx";

export function newIssueButton(navigate: Function) {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn()) {
        return (
            <div className="relative group">
                <button 
                    onClick={() => {}} 
                    disabled 
                    className="px-4 py-2 bg-gray-400 text-gray-600 rounded-lg cursor-not-allowed opacity-50"
                >
                    New Issue
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 !bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Log in to create a new issue
                </div>
            </div>
        );
    }

    return (
        <button 
            onClick={() => navigate("/issues/new")} 
            className="px-4 py-2 !bg-blue-500 text-white rounded-lg hover:!bg-blue-600 transition-colors"
        >
            New Issue
        </button>
    );
}