<template>
  <v-container>
    <v-card class="pa-5">
      <v-card-title>
        <v-row align="center" justify="space-between" no-gutters>
          <v-col>
            <span>Bienvenido, {{ user?.email }}</span>
          </v-col>
          <v-col class="d-flex justify-end">
            <v-btn @click="showModal = true" icon>
              <v-icon>mdi-plus</v-icon>
            </v-btn>
            <v-btn @click="logout" class="ml-3" color="error" icon>
              <v-icon>mdi-logout</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

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
            <v-text-field
              v-model="listName"
              label="Nombre de Lista"
              outlined
              dense
            ></v-text-field>
            <v-checkbox
              v-model="isReminder"
              label="Recordatorio"
              dense
            ></v-checkbox>
            <v-select
              v-if="isReminder"
              v-model="reminderType"
              :items="['Semanal', 'Por Fecha']"
              label="Tipo de Recordatorio"
              outlined
              dense
            ></v-select>
            <v-select
              v-if="isReminder && reminderType === 'Semanal'"
              v-model="reminderDay"
              :items="[
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo',
              ]"
              label="Día de la Semana"
              outlined
              dense
            ></v-select>
            <v-date-picker
              v-if="isReminder && reminderType === 'Por Fecha'"
              v-model="reminderDate"
              label="Fecha del Recordatorio"
              outlined
              dense
            ></v-date-picker>
            <v-text-field
              v-model="listDescription"
              label="Description"
              v-bind="attrs"
              v-on="on"
              required
            ></v-text-field>
          </v-card-subtitle>
          <v-card-actions>
            <v-btn @click="addItem" color="primary">Agregar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<script>
//import { ref } from "vue";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Asegúrate de tener la instancia de Firestore exportada desde firebase.js

export default {
  data() {
    return {
      user: null,
      showModal: false,
      listName: "",
      isReminder: false,
      reminderType: "",
      reminderDay: "",
      reminderDate: null,
      listDescription: "",
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.user = user;
      } else {
        this.$router.push("/login");
      }
    });
  },
  methods: {
    async logout() {
      try {
        await signOut(auth);
        this.$router.push("/login");
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
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
                  date: this.reminderDate,
                }
              : null,
            description: this.listDescription,
            userId: this.user.uid,
          };
          await addDoc(collection(db, "lists"), listData);
          this.showModal = false;
          // Limpiar el formulario
          this.listName = "";
          this.isReminder = false;
          this.reminderType = "";
          this.reminderDay = "";
          this.reminderDate = null;
          this.listDescription = "";
        }
      } catch (error) {
        console.error("Error al agregar la lista:", error);
      }
    },
  },
};
</script>
