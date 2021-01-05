

function init() {

}

init();

function TurnOn(){
    var url = new URL(window.location.origin + "/on");
    fetch(url,{
        method: 'put',
        body: JSON.stringify({}),
        headers: {'Content-Type': 'application/json'},
    })
    .catch(function (error) {
        console.log(error)
    });
};

function TurnOff(){
    var url = new URL(window.location.origin + "/off");
    fetch(url,{
        method: 'put',
        body: JSON.stringify({}),
        headers: {'Content-Type': 'application/json'},
    })
    .catch(function (error) {
        console.log(error)
    });
};

