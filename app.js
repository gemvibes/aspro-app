const DEFAULT_PIN = "1234";

if(!localStorage.getItem("atkData")){
    localStorage.setItem("atkData", JSON.stringify([]));
}

let data = JSON.parse(localStorage.getItem("atkData"));

function login(){
    const pin = document.getElementById("pinInput").value;
    if(pin === DEFAULT_PIN){
        document.getElementById("loginPage").style.display="none";
        document.getElementById("appPage").style.display="block";
    } else {
        alert("PIN Salah");
    }
}

function logout(){
    document.getElementById("appPage").style.display="none";
    document.getElementById("loginPage").style.display="block";
}

const form = document.getElementById("stokForm");
const tabelBody = document.getElementById("tabelBody");
const rekapBody = document.getElementById("rekapBody");
const totalBarang = document.getElementById("totalBarang");
const totalTransaksi = document.getElementById("totalTransaksi");
const filterBulan = document.getElementById("filterBulan");
const barangList = document.getElementById("barangList");

function simpan(){
    localStorage.setItem("atkData", JSON.stringify(data));
}

function updateDropdown(){
    let unik = [...new Set(data.map(d=>d.nama))];
    barangList.innerHTML="";
    unik.forEach(n=>{
        barangList.innerHTML += `<option value="${n}">`;
    });
}

function render(){
    tabelBody.innerHTML="";
    let filter = filterBulan.value;
    let tampil = filter ? data.filter(d=>d.tanggal.startsWith(filter)) : data;

    tampil.forEach((d,i)=>{
        tabelBody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${d.tanggal}</td>
            <td>${d.nama}</td>
            <td>${d.jumlah}</td>
            <td>${d.satuan}</td>
            <td>${d.jenis}</td>
            <td>
                <button onclick="editData(${i})">Edit</button>
                <button onclick="hapusData(${i})">Hapus</button>
            </td>
        </tr>
        `;
    });

    totalTransaksi.textContent=data.length;
    updateRekap();
    updateDropdown();
}

function updateRekap(){
    let stok={};
    data.forEach(d=>{
        if(!stok[d.nama]) stok[d.nama]={jumlah:0,satuan:d.satuan};
        if(d.jenis==="Masuk") stok[d.nama].jumlah+=d.jumlah;
        else stok[d.nama].jumlah-=d.jumlah;
    });

    rekapBody.innerHTML="";
    Object.keys(stok).forEach(nama=>{
        let jumlah = stok[nama].jumlah;
        let satuan = stok[nama].satuan;
        let status = jumlah <= 5 ? "<span class='low-stock'>Stok Menipis</span>" : "Aman";
        rekapBody.innerHTML += `
        <tr>
            <td>${nama}</td>
            <td>${jumlah}</td>
            <td>${satuan}</td>
            <td>${status}</td>
        </tr>
        `;
    });

    totalBarang.textContent=Object.keys(stok).length;
}

form.addEventListener("submit", function(e){
    e.preventDefault();

    const nama=document.getElementById("namaBarang").value;
    const jumlah=parseInt(document.getElementById("jumlah").value);
    const satuan=document.getElementById("satuan").value;
    const jenis=document.getElementById("jenis").value;
    const tanggal=document.getElementById("tanggal").value;
    const editIndex=document.getElementById("editIndex").value;

    if(editIndex===""){
        data.push({nama,jumlah,satuan,jenis,tanggal});
    } else {
        data[editIndex]={nama,jumlah,satuan,jenis,tanggal};
        document.getElementById("editIndex").value="";
    }

    simpan();
    form.reset();
    render();
});

function editData(i){
    let d=data[i];
    document.getElementById("namaBarang").value=d.nama;
    document.getElementById("jumlah").value=d.jumlah;
    document.getElementById("satuan").value=d.satuan;
    document.getElementById("jenis").value=d.jenis;
    document.getElementById("tanggal").value=d.tanggal;
    document.getElementById("editIndex").value=i;
}

function hapusData(i){
    if(confirm("Yakin hapus?")){
        data.splice(i,1);
        simpan();
        render();
    }
}

document.getElementById("exportCSV").addEventListener("click",()=>{
    let csv="Nama,Jumlah,Satuan,Jenis,Tanggal\n";
    data.forEach(d=>{
        csv+=`${d.nama},${d.jumlah},${d.satuan},${d.jenis},${d.tanggal}\n`;
    });
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="atk_enterprise_v5.csv";
    a.click();
});

document.getElementById("backupBtn").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify(data)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="backup_atk.json";
    a.click();
});

document.getElementById("restoreBtn").addEventListener("click",()=>{
    document.getElementById("fileRestore").click();
});

document.getElementById("fileRestore").addEventListener("change",(e)=>{
    const file=e.target.files[0];
    const reader=new FileReader();
    reader.onload=function(evt){
        data=JSON.parse(evt.target.result);
        simpan();
        render();
        alert("Database berhasil direstore");
    };
    reader.readAsText(file);
});

document.getElementById("resetBtn").addEventListener("click",()=>{
    if(confirm("Reset semua data?")){
        data=[];
        simpan();
        render();
    }
});

filterBulan.addEventListener("change",render);

render();