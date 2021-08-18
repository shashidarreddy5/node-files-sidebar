/*
	Assumptions:
		1. Folder location is always an absolute path.
		2. Tested with linux/mac path structure. Didn't test with windows

*/

var fs = require("fs");

var http = require("http");

var resolve = require('path').resolve

var initRequest = true;

var html = `

<html>
	<head>
		<style>
			input[type='button'] {
				border:none;
				background-color:white;
				text-align:left;
			}

			.file{
				color:brown;
			}
		</style>

		<script>
			function sendRequest(path,id) {
				console.log("Path = "+path+"  id = "+id);
				var elem = document.querySelector("#"+id);
				var c0=elem.children[0];
				
				if(elem.childElementCount>1){
					c0.value=c0.value.replace("-","+");
					var c = elem.children[1];
					c.remove();
				} else {
					var xhttp = new XMLHttpRequest();
					xhttp.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 200) {
							var p = document.createElement("div");
							p.innerHTML = this.responseText;
							console.log("Response text for rquest is "+this.responseText);
							elem.appendChild(p);
							c0.value=c0.value.replace("+","-");
						}
					};
					xhttp.open("GET", path, true);
					xhttp.send();
				}
			}
		</script>
	</head>
	<body>
		<form method="GET">
			_{dirs}
			<script>
				var folders = document.querySelectorAll(".folder");
				function createTimer(folder,time){
				    var cnt = 0;
		    		var orig = folder.value;
		    		function inner() {
		        		var tmr=setInterval(()=>{
		            		cnt++;
		            		if(cnt<=10){
		                		folder.value=" "+folder.value;
		            		} else if(cnt<=20){
		                		folder.value=folder.value.substr(1);
		            		} else {
		                		folder.value=orig;
		                		clearInterval(tmr);
		            		}
		        		},time);
				    }
				    return inner;
				}
				for(var i=0;i<folders.length;i++){
				    var folder = folders[i];
				    createTimer(folder,0)();
				}
			</script>
		</form>
	</body>
</html>

`;


function convertArrayToLink(files, origURL, names) {

    var url = origURL;

    var ret = "<ul>";

    for (var i = 0; i < files.length; i++) {
        if (files[i].indexOf(".") !== 0) {
        	var id;
        	if(url === "") {
				id = files[i].replace(/^\./, "").replace(/\//g, "").replace(/ /g, "-");
        	} else {
	            id = url.replace(/^\./, "").replace(/\//g, "").replace(/ /g, "-") + "_" + files[i].replace(/ /g, "-");
        	}
            console.log("url is: "+url+"   id is: "+id);
            var isDir = false;
            try {
                fs.readdirSync(url + "/" + files[i]);
                isDir = true;
            } catch (e) {}

            var path = url === "" ? files[i] : (url + "/" + files[i]);

            if (isDir) {
                ret += "<li id='" + id + "'><input type='button' class='folder' title='" + files[i] + "' onclick='sendRequest(\""+path+"\",\"" + id + "\")' value=\"+ " + names[i] + "\"></li>";
            } else {
                ret += "<li id='" + id + "'><input type='button' class='file' title='" + files[i] + "'  value=\"" + names[i] + "\"></li>";
            }
        }
    }

    ret += "</ul>";
    return ret;

}

var server = http.createServer((req,res)=>{
	var url = resolve(req.url.replace(/%20/g, " "));

 	var files;
 	if(initRequest) {
 		files = [];
 		names = [];
 		for(var i = 2; i < process.argv.length; i++) {
 			files.push(resolve(process.argv[i]));
 			names.push(process.argv[i]);
 		}
		initRequest = false;
	    var resp = html.replace("_{dirs}", convertArrayToLink(files, "", names));
	    res.end(resp);
	}
    console.log(url);
    if (url.indexOf("favicon.ico") === -1) {
        if (url.indexOf("/_OPEN_FILE") === 0) {
            url = url.replace("/_OPEN_FILE", ".");
            url = url.split("?")[0].trim();
        } else {
            try {
                files = fs.readdirSync(url);
                names = [];
                for(var i = 0; i < files.length; i++) {
                	names.push(files[i]);
                }
                var resp = html.replace("_{dirs}", convertArrayToLink(files, url, names));
                res.end(resp);
            } catch (e) {
                res.end("<font color='red'>ERROR</font>");
            }
        }
    }
}
);

server.listen(8888);
