import ResourcesTypesDoughnut from "../charts/ResourcesTypesDoughnut";
import BorrowingLineChart from "../charts/ActivityLineChart";
import MostBorrowedItems from "../charts/MostBorrowedItems";
import SquareTotalAccounts from "../charts/Square-TotalAccounts";
import SquareTotalPendingItems from "../charts/Square-TotalPendingItems";
import SquareTotalAcademicPapers from "../charts/Square-TotalAcademicPapers";
import SquareTotalBooks from "../charts/Square-TotalBooks";

function Home() {
    return (
        <div className="p-4 h-screen text-white">
            <div className="max-w-7xl mx-auto grid gap-4">

                {/* TOP SECTION */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-12">
                    {/* STATS */}
                    <div className=" grid gap-4 pt-2 md:col-span-2 md:grid-cols-4 xl:col-span-3 xl:grid-cols-2">
                        <SquareTotalAccounts />
                        <SquareTotalPendingItems />
                        <SquareTotalAcademicPapers />
                        <SquareTotalBooks />
                    </div>

                    {/* DOUGHNUT */}
                    <div className="min-h-[320px] md:col-span-1 xl:col-span-4">
                        <ResourcesTypesDoughnut />
                    </div>

                    {/* MOST BORROWED */}
                    <div className="min-h-[320px] md:col-span-1 xl:col-span-5">
                        <MostBorrowedItems />
                    </div>
                </div>

                {/* BOTTOM CHART */}
                <div className="rounded-xl min-h-[320px]">
                    <BorrowingLineChart />
                </div>
            </div>
        </div>
    );
}

export default Home;