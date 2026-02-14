let data = JSON.parse(localStorage.getItem("stokData")) || [];

const form = document.getElementById("stokForm");
const tabelBody = document.getElementById("tabelBody");
const rekapBody = document.getElementById("rekapBody");
const totalBarang = document.getElementById("totalBarang");
const totalTransaksi = document.getElementById("totalTransaksi");

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const item = {
        nama: namaBarang.value,
        jumlah: parseInt(jumlah.value),
        satuan: satuan.value,
        jenis: jenis.value,
        tanggal: tanggal.value
    };

    data.push(item);
    simpan();
    render();
    form.reset();
});

function simpan() {
    localStorage.setItem("stokData", JSON.stringify(data));
}

function render() {
    tabelBody.innerHTML = "";
    rekapBody.innerHTML = "";

    let stok = {};

    data.forEach((d, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${d.tanggal}</td>
            <td>${d.nama}</td>
            <td>${d.jumlah}</td>
            <td>${d.satuan}</td>
            <td>${d.jenis}</td>
            <td><button onclick="hapus(${i})">Hapus</button></td>
        `;
        tabelBody.appendChild(tr);

        stok[d.nama] = stok[d.nama] || { jumlah: 0, satuan: d.satuan };
        stok[d.nama].jumlah += d.jenis === "Masuk" ? d.jumlah : -d.jumlah;
    });

    Object.keys(stok).forEach(nama => {
        const s = stok[nama];
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nama}</td>
            <td>${s.jumlah}</td>
            <td>${s.satuan}</td>
            <td>${s.jumlah <= 0 ? "Habis" : "Tersedia"}</td>
        `;
        rekapBody.appendChild(tr);
    });

    totalBarang.textContent = Object.keys(stok).length;
    totalTransaksi.textContent = data.length;
}

function hapus(i) {
    if (confirm("Hapus transaksi?")) {
        data.splice(i, 1);
        simpan();
        render();
    }
}

document.getElementById("exportCSV").onclick = () => {
    let csv = "Tanggal,Nama,Jumlah,Satuan,Jenis\n";
    data.forEach(d => {
        csv += `${d.tanggal},${d.nama},${d.jumlah},${d.satuan},${d.jenis}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "stok.csv";
    a.click();
};

render();
