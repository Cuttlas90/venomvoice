import '../Styles/Pagination.css'
export default function Pagination(props) {

    return (
        <div className='pagination'>
            {
                props.allPages > 3
                &&
                <button
                    onClick={() => props.setActiePage(props.activePage - 1)}
                    className='icon previse'
                    disabled={props.activePage === 0}
                >
                    arrow_forward_ios
                </button>
            }
            {(() => {
                let rows = [];
                if (props.allPages < 6) {
                    for (let i = 0; i < props.allPages; i++) {
                        rows.push(
                            <span onClick={() => props.setActiePage(i)} className={props.activePage === i ? "page activePage" : "page"}>{i + 1}</span>
                        );
                    }
                } else {
                    rows.push(
                        <>
                            <span onClick={() => props.setActiePage(0)} className={props.activePage === 0 ? "page activePage" : "page"}>1</span>
                            <span onClick={() => props.setActiePage(1)} className={props.activePage === 1 ? "page activePage" : "page"}>2</span>
                            <span>...</span>
                            
                            <span>...</span>
                            <span onClick={() => props.setActiePage(props.allPages - 1)} className={props.activePage === props.activePage - 1 ? "page activePage" : "page"}>1</span>
                            <span onClick={() => props.setActiePage(props.allPages)} className={props.activePage === props.activePage ? "page activePage" : "page"}>1</span>
                        </>

                    )
                }
                return rows;
            })()}
            {
                props.allPages > 3
                &&
                <button onClick={() => props.setActivePage(props.activePage + 1)} className='icon next'>arrow_forward_ios</button>
            }
        </div>
    )
}