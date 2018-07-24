var express = require("express"),
app = express(),
mysql = require("mysql"),
bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

var connection = mysql.createConnection({
    host     : '138.68.6.229',
    user     : 'root',
    password : 'default22',
    database: 'cafeteria'
  });
  connection.connect();

app.get("/", function(req,res){
    connection.query("SELECT CASE WHEN PAYMENTS.PAYMENT='cash' THEN 'Efectivo' WHEN PAYMENTS.PAYMENT='cashin' THEN 'Entrada(efectivo)' WHEN PAYMENTS.PAYMENT='cashout' THEN 'Salida(efectivo)' WHEN PAYMENTS.PAYMENT='cashrefund' THEN 'Devolucion' WHEN PAYMENTS.PAYMENT='magcard' THEN 'Tarjeta' ELSE PAYMENTS.PAYMENT END AS PAGO, CONCAT('$', FORMAT(SUM(PAYMENTS.TOTAL), 2)) AS TOTAL FROM PAYMENTS, RECEIPTS WHERE PAYMENTS.RECEIPT = RECEIPTS.ID GROUP BY PAYMENTS.PAYMENT", function(err, rows, fields) {
        if (err) throw err;
        res.render("index", {datas:rows});
      });
});

app.get("/productsFilter", function(req,res){   
    var param = {modulo:req.query.module, ruta: req.query.route, update: req.query.update};
    connection.query("SELECT ID,NAME FROM CATEGORIES WHERE NAME<>'INSUMOS'",function(err, rows, fields) {
        if (err) throw err;
      res.render("productsFilter",{categories: rows, param: param});
    });
});

app.get("/products", function(req,res){
    var param = "";
    if(req.query.code!=undefined&&req.query.code!=="")
        param += " CODE LIKE '%"+req.query.code+"%'";
    
    if(req.query.name!=undefined&&req.query.name!=="")
    {
        if(param.length>0) param += " AND";
        param += " NAME LIKE '%"+req.query.name+"%'";
    }
    if(req.query.category!=undefined&&req.query.category!=="")
    {
        if(param.length>0) param += " AND";
        param += " CATEGORY = '"+req.query.category+"'";
    }
    if(param.length>0) param = " WHERE "+param;
    
    connection.query("SELECT CODE, NAME, CONCAT('$', FORMAT(PRICESELL, 2)) AS PRICESELL FROM PRODUCTS"+param, function(err, rows, fields) {
      if (err) throw err;
      res.render("products"
      ,{products: rows});
    });
});

app.post("/products", function(req,res){
    connection.query("UPDATE PRODUCTS SET PRICESELL='"+req.body.price.replace("$","").replace(",","")+"',NAME='"+req.body.name+"' WHERE CODE='"+ req.body.code +"'", function(err, rows, fields) {
      if (err) throw err;
      res.redirect("productsFilter?module=Productos&route=products&update=1");
    });
});

app.get("/products/:code", function(req,res){
    connection.query("SELECT CODE, NAME, CONCAT('$', FORMAT(PRICESELL, 2)) AS PRICESELL FROM PRODUCTS WHERE CODE='"+req.params.code+"'", function(err, rows, fields) {
      if (err) throw err;
      res.render("editProduct",{product: rows});
    });
});

app.get("/stock", function(req,res){    
    var param = "";
    if(req.query.code!=undefined&&req.query.code!=="")
        param += " P.CODE LIKE '%"+req.query.code+"%'";
    
    if(req.query.name!=undefined&&req.query.name!=="")
    {
        if(param.length>0) param += " AND";
        param += " P.NAME LIKE '%"+req.query.name+"%'";
    }
    if(req.query.category!=undefined&&req.query.category!=="")
    {
        if(param.length>0) param += " AND";
        param += " P.CATEGORY = '"+req.query.category+"'";
    }
    if(param.length>0) param = " WHERE "+param;
    
    connection.query("SELECT S.UNITS,P.NAME,CONCAT('$', FORMAT(P.PRICEBUY, 2)) AS PRICEBUY FROM STOCKCURRENT S JOIN PRODUCTS P ON S.PRODUCT=P.ID"+param, function(err, rows, fields) {
      if (err) throw err;
      res.render("stock",{stock: rows});
    });
});

app.get("/sales", function(req,res){    
    connection.query("SELECT ID,NAME FROM CATEGORIES",function(err, rows, fields) {
        if (err) throw err;
      res.render("sales",{categories: rows});
    });
});

app.post("/sales", function(req,res){  
    var param= "";
    if(req.body.category!=undefined&&req.body.category!=="")
    {
        param = "P.CATEGORY='"+req.body.category+"'";
    }
    if(req.body.fechaInicio!=undefined&&req.body.fechaFin!=undefined&&req.body.fechaInicio!==""&&req.body.fechaFin!=="")
    {
        if(param.length>0) param += " AND ";
        param = "R.DATENEW BETWEEN '"+req.body.fechaInicio+"' AND '"+req.body.fechaFin+"'";
    }
    if(param.length>0) param = " WHERE "+param;
    console.log("SELECT SUM(TL.UNITS) AS UNITS,P.NAME, CONCAT('$', FORMAT(SUM(TL.PRICE), 2)) AS PRICE FROM TICKETLINES TL JOIN TICKETS T ON T.ID=TL.TICKET JOIN PRODUCTS P ON P.ID=TL.PRODUCT JOIN RECEIPTS R ON R.ID=T.ID "+param+" GROUP BY P.NAME ORDER BY P.NAME");
    connection.query("SELECT SUM(TL.UNITS) AS UNITS,P.NAME, CONCAT('$', FORMAT(SUM(TL.PRICE), 2)) AS PRICE FROM TICKETLINES TL JOIN TICKETS T ON T.ID=TL.TICKET JOIN PRODUCTS P ON P.ID=TL.PRODUCT JOIN RECEIPTS R ON R.ID=T.ID "+param+" GROUP BY P.NAME ORDER BY P.NAME", function(err, rows, fields) {
        if (err) throw err;
        var obj = [req.body.fechaInicio,req.body.fechaFin];
        res.render("salesReport",{sales: rows, obj: obj});
      });
});

app.listen("5000", "localhost", function(){
console.log("Servidor iniciado");        
});