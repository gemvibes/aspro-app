// ===== INIT SUPABASE =====
const supabaseUrl = "https://jlsltubltnowfnmuefgg.supabase.co";
const supabaseKey = "sb_publishable_yun5vfOi8OwyyxRi1GpfIQ_-ZioIciI";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

window.addEventListener('DOMContentLoaded', function(){

  // ===== LOGIN & LOGOUT =====
  const correctPin = "1234";
  const loginPage = document.getElementById("loginPage");
  const appPage = document.getElementById("appPage");

  document.querySelector("#loginPage button").addEventListener('click', ()=>{
      const pin = document.getElementById("pinInput").value;
      if(pin === correctPin){
          loginPage.style.display = "none";
          appPage.style.display = "block";
          alert("Login berhasil!");
          loadItems(); // panggil loadItems setelah supabase siap & login sukses
      } else {
          alert("PIN salah!");
      }
  });

  window.logout = function() {
      loginPage.style.display = "block";
      appPage.style.display = "none";
  }

  // ===== TAMBAH ITEM =====
  async function addItem(name, quantity, unit, type, date) {
      try {
          const { data, error } = await supabase.from('items').insert([{name, quantity, unit, type, date}]);
          if(error) throw error;
          alert("Berhasil menambahkan item!");
          loadItems();
      } catch(err){
          console.error("Insert error:", err);
          alert("Gagal menyimpan: " + err.message);
      }
  }

  // ===== LOAD ITEMS =====
  async function loadItems() {
      try {
          const { data, error } = await supabase.from('items').select('*').order('id',{ascending:true});
          if(error) throw error;

          const tableBody = document.getElementById('tabelBody');
          const barangList = document.getElementById('barangList');
          tableBody.innerHTML = "";
          barangList.innerHTML = "";
          document.getElementById('totalBarang').innerText = data.length;
          document.getElementById('totalTransaksi').innerText = data.length;

          data.forEach((item,index)=>{
              const row = `<tr>
                  <td>${index+1}</td>
                  <td>${item.date}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>${item.type}</td>
                  <td>
                      <button onclick="editItem(${item.id})">Edit</button>
                      <button onclick="deleteItem(${item.id})">Hapus</button>
                  </td>
              </tr>`;
              tableBody.innerHTML += row;
              barangList.innerHTML += `<option value="${item.name}">`;
          });
      } catch(err){
          console.error("Load error:", err);
          alert("Gagal load data: " + err.message);
      }
  }

  // ===== SIMPAN TRANSAKSI =====
  document.getElementById('stokForm').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const idEdit = document.getElementById('editIndex').value;
      const name = document.getElementById('namaBarang').value;
      const quantity = parseInt(document.getElementById('jumlah').value);
      const unit = document.getElementById('satuan').value;
      const type = document.getElementById('jenis').value;
      const date = document.getElementById('tanggal').value;

      if(!name || !quantity || !unit || !type || !date){
          alert("Isi semua field dulu!");
          return;
      }

      if(idEdit){ 
          // Edit
          try {
              const { error } = await supabase.from('items').update({name, quantity, unit, type, date}).eq('id',parseInt(idEdit));
              if(error) throw error;
              alert("Update berhasil!");
              document.getElementById('stokForm').reset();
              document.getElementById('editIndex').value = "";
              loadItems();
          } catch(err){
              console.error("Update error:", err);
              alert("Gagal update: "+err.message);
          }
      } else { 
          // Tambah baru
          await addItem(name, quantity, unit, type, date);
          document.getElementById('stokForm').reset();
      }
  });

  // ===== EDIT & DELETE =====
  window.editItem = async function(id){
      try{
          const { data, error } = await supabase.from('items').select('*').eq('id',id);
          if(error) throw error;
          if(data && data.length>0){
              const item = data[0];
              document.getElementById('editIndex').value=id;
              document.getElementById('namaBarang').value=item.name;
              document.getElementById('jumlah').value=item.quantity;
              document.getElementById('satuan').value=item.unit;
              document.getElementById('jenis').value=item.type;
              document.getElementById('tanggal').value=item.date;
          }
      } catch(err){
          console.error("Edit error:", err);
          alert("Gagal load data untuk edit: "+err.message);
      }
  }

  window.deleteItem = async function(id){
      if(confirm("Yakin hapus item ini?")){
          try{
              const { error } = await supabase.from('items').delete().eq('id',id);
              if(error) throw error;
              loadItems();
          } catch(err){
              console.error("Hapus error:", err);
              alert("Gagal hapus item: "+err.message);
          }
      }
  }

  // ===== FILTER BULAN =====
  document.getElementById('filterBulan').addEventListener('change', async ()=>{
      const month = document.getElementById('filterBulan').value;
      try {
          const { data, error } = await supabase.from('items').select('*').like('date', `${month}%`).order('id',{ascending:true});
          if(error) throw error;
          const tableBody = document.getElementById('tabelBody');
          tableBody.innerHTML="";
          data.forEach((item,index)=>{
              const row = `<tr>
                  <td>${index+1}</td>
                  <td>${item.date}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>${item.type}</td>
                  <td>
                      <button onclick="editItem(${item.id})">Edit</button>
                      <button onclick="deleteItem(${item.id})">Hapus</button>
                  </td>
              </tr>`;
              tableBody.innerHTML += row;
          });
      } catch(err){
          console.error("Filter error:", err);
          alert("Gagal filter data: "+err.message);
      }
  });

  // ===== EXPORT CSV =====
  document.getElementById('exportCSV').addEventListener('click', async ()=>{
      try {
          const { data, error } = await supabase.from('items').select('*');
          if(error) throw error;
          let csv = "No,Tanggal,Nama,Jumlah,Satuan,Jenis\n";
          data.forEach((item,index)=>{
              csv += `${index+1},${item.date},${item.name},${item.quantity},${item.unit},${item.type}\n`;
          });
          const blob = new Blob([csv], { type: 'text/csv' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = "aspro_v2_transaksi.csv";
          link.click();
      } catch(err){
          console.error("CSV error:", err);
          alert("Gagal export CSV: "+err.message);
      }
  });

});
