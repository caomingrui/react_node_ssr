import React from "react";

const A = (props) => {

    return (
        <div>
            <p>A</p>
            {props && props.children}
        </div>
    );
};

export default A;