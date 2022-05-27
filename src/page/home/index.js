import React, {useState} from "react";

const Home = (props) => {
    // console.log(props, 'props')
    return (
        <div>
            home {props && props.children}
        </div>
    );
}

export default Home;