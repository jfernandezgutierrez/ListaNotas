<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>
        <v-row align="center" justify="space-between" no-gutters>
          <v-col>
            <span>Bienvenido, {{ user?.email }}</span>
          </v-col>
          <v-col class="d-flex align-center">
            <!-- Campo de búsqueda -->
            <v-text-field
              v-model="searchQuery"
              label="Buscar por nombre"
              outlined
              dense
              append-icon="mdi-magnify"
            ></v-text-field>
            <!-- Botones de acción -->
            <v-btn @click="showModal = true" icon class="ml-3">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn @click="logout" class="ml-3" color="error" icon>
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <!-- Mostrar las listas creadas -->
      <v-list>
        <v-list-item-group>
          <v-list-item v-for="(list, index) in filteredLists" :key="index" class="mb-4">
            <v-card class="w-100">
              <v-card-title>
                {{ list.name }}
              </v-card-title>
              <v-card-subtitle>
                {{ list.description }}
              </v-card-subtitle>
              <v-card-actions>
                <v-btn @click="openListDialog(list)" color="primary">
                  Ver
                </v-btn>
                <v-btn @click="deleteList(list.id)" color="error">
                  Eliminar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-list-item>
        </v-list-item-group>
      </v-list>

      <!-- Modal para agregar lista -->
      <v-dialog v-model="showModal" max-width="600px">
        <v-card>
          <v-card-title>
            Crear Nueva Lista
            <v-spacer></v-spacer>
            <v-btn @click="showModal = false" icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            <v-text-field v-model="listName" label="Nombre de Lista" outlined dense></v-text-field>
            <v-checkbox v-model="isReminder" label="Recordatorio" dense></v-checkbox>
            <v-select v-if="isReminder" v-model="reminderType" :items="['Semanal', 'Por Fecha']"
              label="Tipo de Recordatorio" outlined dense></v-select>
            <v-select v-if="isReminder && reminderType === 'Semanal'" v-model="reminderDay" :items="[ 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']" label="Día de la Semana" outlined dense></v-select>
            <v-date-picker v-if="isReminder && reminderType === 'Por Fecha'" v-model="reminderDate"
              label="Fecha del Recordatorio" outlined dense></v-date-picker>

            <!-- Sección para agregar múltiples descripciones -->
            <div v-for="(description, index) in descriptions" :key="index">
              <v-text-field v-model="description.text" label="Descripción" required></v-text-field>
            </div>
            <!-- Botón para agregar más descripciones -->
            <v-btn @click="addDescription" icon color="primary">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn @click="addItem" color="primary">Agregar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Diálogo para ver lista y sus descripciones -->
      <v-dialog v-model="showListDialog" max-width="600px">
        <v-card>
          <v-card-title>
            {{ selectedList.name }}
            <v-spacer></v-spacer>
            <v-btn @click="showListDialog = false" icon>
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-subtitle>
            <!-- Mostrar cada descripción con un checkbox -->
            <v-row v-for="(description, index) in selectedList.descriptions" :key="index">
              <v-col cols="8">
                <span>{{ description.text }}</span>
              </v-col>
              <v-col cols="4">
                <v-checkbox v-model="description.completo" color="success"></v-checkbox>
              </v-col>
            </v-row>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn @click="saveChanges" color="primary">Guardar</v-btn>
            <v-btn @click="markAllComplete" color="success">Desmarcar Todos</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>


<script>
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { parse, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default {
  data() {
    return {
      user: null,
      showModal: false,
      showListDialog: false,
      listName: "",
      isReminder: false,
      reminderType: "",
      reminderDay: "",
      reminderDate: null,
      descriptions: [{ text: "", completo: 0 }],
      lists: [],
      selectedList: {},
      errorMessage: "",
      searchQuery: "", // Campo de búsqueda
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
        this.fetchLists();
        this.checkReminders(); // Revisar si hay recordatorios que mostrar
      } else {
        this.$router.push("/login");
      }
    });
  },
  computed: {
    filteredLists() {
      const query = this.searchQuery.trim().toLowerCase();
      return this.lists.filter(list => list.name.toLowerCase().includes(query));
    }
  },
  methods: {
    markAllComplete() {
      this.selectedList.descriptions.forEach(description => {
        description.completo = false;
      });
    },
    async logout() {
      try {
        await signOut(auth);
        this.$router.push("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
      }
    },
    addDescription() {
      const newDescription = { text: "", completo: 0 };
      if (!this.descriptions.some((desc) => desc.text === newDescription.text)) {
        this.descriptions.push(newDescription);
        this.errorMessage = "";
      } else {
        this.errorMessage = "La descripción ya existe.";
      }
    },
    async addItem() {
      try {
        if (this.user) {
          const listData = {
            name: this.listName,
            reminder: this.isReminder
              ? {
                type: this.reminderType,
                day: this.reminderDay,
                date: this.reminderDate ? format(this.reminderDate, "yyyy-MM-dd") : null, // Guardar solo año-mes-día
              }
              : null,
            descriptions: this.descriptions,
            userId: this.user.uid,
          };
          await addDoc(collection(db, "lists"), listData);
          this.resetForm();
          this.fetchLists();
        }
      } catch (error) {
        console.error("Error al agregar la lista:", error);
      }
    },
    resetForm() {
      this.showModal = false;
      this.listName = "";
      this.isReminder = false;
      this.reminderType = "";
      this.reminderDay = "";
      this.reminderDate = null;
      this.descriptions = [{ text: "", completo: 0 }];
    },
    async fetchLists() {
      try {
        const querySnapshot = await getDocs(collection(db, "lists"));

        // Obtener el día actual en formato año-mes-día
        const today = new Date();
        const todayFormatted = format(today, "yyyy-MM-dd");

        this.lists = querySnapshot.docs
          .map((doc) => {
            const list = doc.data();

            // Verificar si la lista tiene un recordatorio
            if (list.reminder) {
              if (list.reminder.type === "Semanal" && list.reminder.day.toUpperCase() !== today.toLocaleString("es-ES", { weekday: "long" }).toUpperCase()) {
                // Si el recordatorio es semanal pero no es el día correcto, no incluirla
                return null;
              } else if (list.reminder.type === "Por Fecha" && list.reminder.date) {
                if (list.reminder.date !== todayFormatted) {
                  return null; // Excluir listas cuya fecha no sea hoy
                }
              }
            }

            return { ...list, id: doc.id }; // Incluir las listas que pasaron el filtro
          })
          .filter((list) => list !== null); // Filtrar las que no pasaron el filtro y quedaron como `null`
      } catch (error) {
        console.error("Error al obtener las listas:", error);
      }
    },
    async deleteList(listId) {
      try {
        await deleteDoc(doc(db, "lists", listId));
        this.fetchLists();
      } catch (error) {
        console.error("Error al eliminar la lista:", error);
      }
    },
    openListDialog(list) {
      this.selectedList = { ...list };
      this.showListDialog = true;
    },
    async saveChanges() {
      try {
        const listRef = doc(db, "lists", this.selectedList.id);
        await updateDoc(listRef, { descriptions: this.selectedList.descriptions });
        this.showListDialog = false;
        this.fetchLists();
      } catch (error) {
        console.error("Error al guardar los cambios:", error);
      }
    },
    sendNotification(list) {
      if (Notification.permission === "granted") {
        new Notification(`Recordatorio: ${list.name}`, {
          body: list.description || "Tienes una nueva tarea pendiente.",
          icon: "/path/to/icon.png",
        });
      }
    },
    checkReminders() {
      if (Notification.permission !== "denied" && Notification.permission !== "granted") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.fetchLists();
          }
        });
      } else if (Notification.permission === "granted") {
        this.fetchLists();
      }
    },
  },
};
</script>

