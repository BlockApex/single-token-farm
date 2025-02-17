import React from "react";
import ReactPaginate from "react-paginate";

interface PaginationProps {
  pageCount: number;
  onPageChange: (selectedItem: { selected: number }) => void;
  currentPage: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  pageCount,
  onPageChange,
  currentPage,
}) => {
  // A wrapper for handling page changes that ensures selected page is an integer
  const handlePageChange = (selectedItem: { selected: number }) => {
    const selectedPage = Math.ceil(selectedItem.selected);
    onPageChange({ selected: selectedPage });
  };

  return (
    <div className="pagination-wrapper">
      <button
        onClick={() => handlePageChange({ selected: 0 })}
        disabled={currentPage === 0}
        className="pagination-button"
      >
        {"<<"}
      </button>

      <ReactPaginate
        previousLabel={"<"}
        nextLabel={">"}
        breakLabel={"..."}
        breakClassName={"break-me"}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={handlePageChange}
        containerClassName={"pagination"}
        activeClassName={"active"}
        forcePage={currentPage}
      />

      <button
        onClick={() => handlePageChange({ selected: pageCount - 1 })}
        disabled={currentPage === pageCount - 1}
        className="pagination-button"
      >
        {">>"}
      </button>
    </div>
  );
};
