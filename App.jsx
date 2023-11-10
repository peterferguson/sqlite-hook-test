import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, View } from 'react-native';
import { useEffect, useState } from 'react'
import { openDatabaseSync, SQLiteProvider, useSQLiteContext, addDatabaseChangeListener } from 'expo-sqlite/next';
import React from 'react';
import { Pressable } from 'react-native';

const db = openDatabaseSync( ':memory:', {
  enableChangeListener: true
} );

db.execSync(
  'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER)'
);

const insertRow = ( isTimestamp = false ) => db.runSync( 'INSERT INTO test (value, intValue) VALUES (?, ?)', 'test', isTimestamp ? Date.now() : 123 )
const truncate = () => db.runSync( 'DELETE FROM test' )

console.log( 'insert - ', insertRow() );

const statement = db.prepareSync( 'SELECT * FROM test' );
for ( const row of statement.eachSync() ) {
  console.log( 'row -', row );
}

export default function App() {
  return (
    <View style={ styles.container }>
      <SQLiteProvider dbName=":memory:">
        <Child />
      </SQLiteProvider>
      <StatusBar style="auto" />
    </View>
  );
}

const Child = () => {
  const database = useSQLiteContext()

  const [isTimestamp, setIsTimestamp] = useState( false )
  const [rows, setRows] = useState( database.allSync( 'SELECT * FROM test' ) )

  const refreshRows = () => setRows( database.allSync( 'SELECT * FROM test' ) )

  useEffect( () => {
    const subscription = addDatabaseChangeListener( ( change ) => {
      console.log( `detected change - `, change )
      refreshRows()
    } )

    return () => {
      subscription.remove()
    }
  }, [] )

  useEffect( () => {
    const interval = setInterval( () => insertRow( isTimestamp ), 1000 )

    return () => {
      interval && clearInterval( interval )
    }

  }, [isTimestamp] )

  useEffect( () => {
    if ( rows.length > 25 ) truncate()
    refreshRows()
  }, [rows.length] )


  if ( !rows ) return <Text style={ styles.text }>Nothing</Text>
  return <View style={ styles.container }>
    <Pressable
      style={ { marginVertical: 40 } }
      onPress={ () => {
        setIsTimestamp( true )
      } }>
      <Text>Insert { isTimestamp ? 'Integer' : 'Timestamp' }</Text>
    </Pressable>
    <ScrollView>
      { rows?.map( ( row, i ) => {
        return <Text key={ `row-${i}` } style={ styles.text }>{ i } - { row.value }</Text>
      } ) }
    </ScrollView>

  </View>
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#939393',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fafafa',
    fontSize: 24,
  }
} );
